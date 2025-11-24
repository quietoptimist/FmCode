// @ts-nocheck
// fnRegistry.mjs

export const fnRegistry = {

  // ==================================
  // ScaleDrv — used for all QuantDrv, CostDrv, RevDrv type objects with a simple output = input x assum
  // ==================================
  ScaleDrv(ctx, inputs, cfg) {
    const months = ctx.months;
    const alias =
      (cfg.outputNames && cfg.outputNames[0])
        ? cfg.outputNames[0]
        : "val";

    const outAss = cfg.output || {};
    const factor = outAss.factor
      ? outAss.factor.value
      : new Float64Array(months).fill(1);
    const startMonthVal = outAss.startMonth
      ? outAss.startMonth.value
      : 0;
    const startMonth = (startMonthVal instanceof Float64Array || Array.isArray(startMonthVal))
      ? startMonthVal[0]
      : startMonthVal;

    // channel from schema
    const channelNames = cfg.channels ? Object.keys(cfg.channels) : ["val"];
    const channelName = channelNames[0];

    const baseInput = inputs[0] || new Float64Array(months).fill(0);
    const outSeries = new Float64Array(months);

    for (let m = 0; m < months; m++) {
      if (m < startMonth) {
        outSeries[m] = 0;
        continue;
      }
      outSeries[m] = baseInput[m] * factor[m];
    }

    // return BOTH: alias (convenience) + declared channel
    return {
      [alias]: outSeries,
      [channelName]: outSeries,
    };
  },

  // ==================================
  // QuantStart — uses cfg.output.amount.value
  // ==================================
  QuantStart(ctx, _inputs, cfg) {
    const months = ctx.months;
    const outName = (cfg.outputNames && cfg.outputNames[0]) ? cfg.outputNames[0] : "val";
    const outAss = cfg.output || {};
    const amount = outAss.amount ? outAss.amount.value : new Float64Array(months).fill(0);
    const startMonthVal = outAss.startMonth ? outAss.startMonth.value : 0;
    const startMonth = (startMonthVal instanceof Float64Array || Array.isArray(startMonthVal)) ? startMonthVal[0] : startMonthVal;

    const outSeries = new Float64Array(months);
    for (let m = 0; m < months; m++) {
      if (m < startMonth) {
        outSeries[m] = 0;
        continue;
      }
      outSeries[m] = amount[m];
    }

    return { [outName]: outSeries };
  },

  // ==================================
  // SubRetain — uses cfg.output.churnRate.value and startMonth.value
  // ==================================
  SubRetain(ctx, inputs, cfg) {
    const months = ctx.months;
    const outName = (cfg.outputNames && cfg.outputNames[0]) ? cfg.outputNames[0] : "val";
    const outAss = cfg.output || {};
    const churnMonthly = outAss.churnRate ? outAss.churnRate.value : new Float64Array(months).fill(0);
    const startMonthVal = outAss.startMonth ? outAss.startMonth.value : 0;
    const startMonth = (startMonthVal instanceof Float64Array || Array.isArray(startMonthVal)) ? startMonthVal[0] : startMonthVal;

    const newCust = inputs[0] || new Float64Array(months).fill(0);

    const actSeries = new Float64Array(months);
    const chuSeries = new Float64Array(months);

    let prevActive = 0;
    for (let m = 0; m < months; m++) {
      if (m < startMonth) {
        actSeries[m] = 0;
        chuSeries[m] = 0;
        prevActive = 0;
        continue;
      }
      const added = newCust[m] ?? 0;
      const rate = churnMonthly[m] ?? 0;
      const churned = prevActive * rate;
      let activeNow = prevActive + added - churned;
      if (activeNow < 0) activeNow = 0;

      actSeries[m] = activeNow;
      chuSeries[m] = churned;
      prevActive = activeNow;
    }

    return {
      act: actSeries,
      chu: chuSeries,
    };
  },

  // ==================================
  // delay inputs
  // ==================================
  Delay(ctx, inputs, cfg) {
    const months = ctx.months;
    const outName = (cfg.outputNames && cfg.outputNames[0]) ? cfg.outputNames[0] : "val";
    const outAss = cfg.output || {};

    // we let the pipeline give us a monthly array of delays,
    // but most of the time it will just be the same number repeated
    const delayArr = outAss.delayMonths
      ? outAss.delayMonths.value
      : new Float64Array(months).fill(0);

    // we expect exactly one input series for this output
    const src = inputs[0] || new Float64Array(months).fill(0);

    const out = new Float64Array(months);

    for (let m = 0; m < months; m++) {
      // get the delay for THIS month
      const d = Math.floor(delayArr[m] ?? 0);
      const target = m + d;
      if (target < months) {
        out[target] += src[m];   // += in case user ever stacks inputs
      }
    }

    return { [outName]: out };
  },

  // ==================================
  // Sum unchanged
  // ==================================
  Sum(ctx, inputs) {
    const months = ctx.months;
    const outSeries = new Float64Array(months);
    for (const s of inputs) {
      for (let m = 0; m < months; m++) {
        outSeries[m] += s[m];
      }
    }
    return { val: outSeries };
  },

  // ==================================
  // StaffDriven — calculates headcount from activity ÷ productivity
  // ==================================
  StaffDriven(ctx, inputs, cfg) {
    const months = ctx.months;
    const outAss = cfg.output || {};

    // Extract the two assumptions
    const productivity = outAss.productivity
      ? outAss.productivity.value
      : new Float64Array(months).fill(1);
    const salary = outAss.salary
      ? outAss.salary.value
      : new Float64Array(months).fill(0);

    // Get the input activity (first input)
    const activity = inputs[0] || new Float64Array(months).fill(0);

    // Calculate headcount and cost arrays
    const headsSeries = new Float64Array(months);
    const costSeries = new Float64Array(months);

    for (let m = 0; m < months; m++) {
      // Headcount = activity ÷ productivity
      const headCount = productivity[m] > 0 ? activity[m] / productivity[m] : 0;
      headsSeries[m] = headCount;
      costSeries[m] = headCount * salary[m];
    }

    return {
      heads: headsSeries,
      cost: costSeries
    };
  },

  // ==================================
  // StaffTeams — calculates staff costs from headCount × salary
  // ==================================
  StaffTeams(ctx, inputs, cfg) {
    const months = ctx.months;
    const outAss = cfg.output || {};

    // Extract the two assumptions
    const headCount = outAss.headCount
      ? outAss.headCount.value
      : new Float64Array(months).fill(0);
    const salary = outAss.salary
      ? outAss.salary.value
      : new Float64Array(months).fill(0);

    // Calculate total cost and headcount arrays
    const costSeries = new Float64Array(months);
    const headsSeries = new Float64Array(months);

    for (let m = 0; m < months; m++) {
      headsSeries[m] = headCount[m];
      costSeries[m] = headCount[m] * salary[m];
    }

    return {
      heads: headsSeries,
      cost: costSeries
    };
  },

  // ==================================
  // StaffRoles — for individual roles (CEO, CFO, etc.) where headcount is always 1
  // ==================================
  StaffRoles(ctx, inputs, cfg) {
    const months = ctx.months;
    const outAss = cfg.output || {};

    // Only salary assumption - headcount is implicitly 1
    const salary = outAss.salary
      ? outAss.salary.value
      : new Float64Array(months).fill(0);

    // Calculate total cost and headcount arrays
    const costSeries = new Float64Array(months);
    const headsSeries = new Float64Array(months);

    for (let m = 0; m < months; m++) {
      // Cost is just the salary (headCount is always 1 when active)
      costSeries[m] = salary[m];
      // Heads is 1 when there's a salary, 0 otherwise
      headsSeries[m] = salary[m] > 0 ? 1 : 0;
    }

    return {
      heads: headsSeries,
      cost: costSeries
    };
  },

  Setup(ctx) {
    return { val: new Float64Array(ctx.months) };
  },
};