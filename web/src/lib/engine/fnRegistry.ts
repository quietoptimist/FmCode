// @ts-nocheck
// fnRegistry.mjs

export const fnRegistry = {

  // ==================================
  // Multiply — used for all QuantMul, CostMul, RevMul type objects with a simple output = input x assum
  // ==================================
  Multiply(ctx, inputs, cfg) {
    const months = ctx.months;
    const alias =
      (cfg.outputNames && cfg.outputNames[0])
        ? cfg.outputNames[0]
        : "val";

    const outAss = cfg.output || {};
    const factor = outAss.factor
      ? outAss.factor.value
      : new Float64Array(months).fill(1);
    const startMonthVal = outAss.start ? outAss.start.value : 0;
    const startMonth = (startMonthVal instanceof Float64Array || Array.isArray(startMonthVal)) ? startMonthVal[0] : startMonthVal;

    const endMonthVal = outAss.end ? outAss.end.value : null;
    const endMonth = (endMonthVal instanceof Float64Array || Array.isArray(endMonthVal)) ? endMonthVal[0] : endMonthVal;

    // channel from schema
    const channelNames = cfg.channels ? Object.keys(cfg.channels) : ["val"];
    const channelName = channelNames[0];

    const baseInput = inputs[0] || new Float64Array(months).fill(0);
    const outSeries = new Float64Array(months);

    // Only apply date range if dateRangeEnabled is true (AND logic)
    const dateRangeEnabled = cfg.dateRangeEnabled ?? true;
    const effectiveStart = (dateRangeEnabled && startMonth > 0) ? startMonth - 1 : 0;
    const effectiveEnd = (dateRangeEnabled && endMonth !== null && endMonth !== undefined) ? endMonth : months;

    for (let m = 0; m < months; m++) {
      if (m < effectiveStart || m >= effectiveEnd) {
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
    const startMonthVal = outAss.start ? outAss.start.value : 0;
    const startMonth = (startMonthVal instanceof Float64Array || Array.isArray(startMonthVal)) ? startMonthVal[0] : startMonthVal;

    const endMonthVal = outAss.end ? outAss.end.value : null;
    const endMonth = (endMonthVal instanceof Float64Array || Array.isArray(endMonthVal)) ? endMonthVal[0] : endMonthVal;

    // Only apply date range if dateRangeEnabled is true (AND logic)
    const dateRangeEnabled = cfg.dateRangeEnabled ?? true;
    const effectiveStart = (dateRangeEnabled && startMonth > 0) ? startMonth - 1 : 0;
    const effectiveEnd = (dateRangeEnabled && endMonth !== null && endMonth !== undefined) ? endMonth : months;

    const outSeries = new Float64Array(months);
    for (let m = 0; m < months; m++) {
      if (m < effectiveStart || m >= effectiveEnd) {
        outSeries[m] = 0;
        continue;
      }
      outSeries[m] = amount[m];
    }

    return { [outName]: outSeries };
  },

  // ==================================
  // QuantPulse — creates a single month pulse
  // ==================================
  QuantPulse(ctx, _inputs, cfg) {
    const months = ctx.months;
    const outName = (cfg.outputNames && cfg.outputNames[0]) ? cfg.outputNames[0] : "val";
    const outAss = cfg.output || {};

    // Amount assumption
    const amount = outAss.amount ? outAss.amount.value : new Float64Array(months).fill(0);

    // Month assumption
    const monthVal = outAss.month ? outAss.month.value : 0;
    const targetMonth = (monthVal instanceof Float64Array || Array.isArray(monthVal)) ? monthVal[0] : monthVal;

    const outSeries = new Float64Array(months);
    const cumSeries = new Float64Array(months);

    // 1-based month index
    const mIndex = (targetMonth > 0) ? Math.floor(targetMonth) - 1 : -1;

    let runningTotal = 0;
    for (let m = 0; m < months; m++) {
      let val = 0;
      if (m === mIndex) {
        val = amount[m];
      }
      outSeries[m] = val;
      runningTotal += val;
      cumSeries[m] = runningTotal;
    }

    return {
      [outName]: outSeries,
      val: outSeries,
      cum: cumSeries
    };
  },

  // ==================================
  // SubRetain — uses cfg.output.churnRate.value and startMonth.value
  // ==================================
  SubRetain(ctx, inputs, cfg) {
    const months = ctx.months;
    const outName = (cfg.outputNames && cfg.outputNames[0]) ? cfg.outputNames[0] : "val";
    const outAss = cfg.output || {};
    const churnMonthly = outAss.churn ? outAss.churn.value : new Float64Array(months).fill(0);
    const startMonthVal = outAss.start ? outAss.start.value : 0;
    const startMonth = (startMonthVal instanceof Float64Array || Array.isArray(startMonthVal)) ? startMonthVal[0] : startMonthVal;

    const endMonthVal = outAss.end ? outAss.end.value : null;
    const endMonth = (endMonthVal instanceof Float64Array || Array.isArray(endMonthVal)) ? endMonthVal[0] : endMonthVal;

    const newCust = inputs[0] || new Float64Array(months).fill(0);

    const actSeries = new Float64Array(months);
    const chuSeries = new Float64Array(months);

    // Only apply date range if dateRangeEnabled is true (AND logic)
    const dateRangeEnabled = cfg.dateRangeEnabled ?? true;
    const effectiveStart = (dateRangeEnabled && startMonth > 0) ? startMonth - 1 : 0;
    const effectiveEnd = (dateRangeEnabled && endMonth !== null && endMonth !== undefined) ? endMonth : months;

    let prevActive = 0;
    for (let m = 0; m < months; m++) {
      if (m < effectiveStart || m >= effectiveEnd) {
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
  // StaffDiv — calculates headcount from activity ÷ productivity
  // ==================================
  StaffDiv(ctx, inputs, cfg) {
    const months = ctx.months;
    const outAss = cfg.output || {};

    // Extract the two assumptions
    const productivity = outAss.productivity
      ? outAss.productivity.value
      : new Float64Array(months).fill(1);
    const salary = outAss.salary
      ? outAss.salary.value
      : new Float64Array(months).fill(0);

    const startMonthVal = outAss.start ? outAss.start.value : 0;
    const startMonth = (startMonthVal instanceof Float64Array || Array.isArray(startMonthVal)) ? startMonthVal[0] : startMonthVal;

    const endMonthVal = outAss.end ? outAss.end.value : null;
    const endMonth = (endMonthVal instanceof Float64Array || Array.isArray(endMonthVal)) ? endMonthVal[0] : endMonthVal;

    // Get the input activity (first input)
    const activity = inputs[0] || new Float64Array(months).fill(0);

    // Calculate headcount and cost arrays
    const headsSeries = new Float64Array(months);
    const costSeries = new Float64Array(months);

    // Only apply date range if dateRangeEnabled is true (AND logic)
    const dateRangeEnabled = cfg.dateRangeEnabled ?? true;
    const effectiveStart = (dateRangeEnabled && startMonth > 0) ? startMonth - 1 : 0;
    const effectiveEnd = (dateRangeEnabled && endMonth !== null && endMonth !== undefined) ? endMonth : months;

    for (let m = 0; m < months; m++) {
      if (m < effectiveStart || m >= effectiveEnd) {
        headsSeries[m] = 0;
        costSeries[m] = 0;
        continue;
      }
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
  // StaffTeam — calculates staff heads and salary from heads per location
  // ==================================
  StaffTeam(ctx, inputs, cfg) {
    const months = ctx.months;
    const outAss = cfg.output || {};

    // Extract the two assumptions
    const headCount = outAss.headCount
      ? outAss.headCount.value
      : new Float64Array(months).fill(0);
    const salary = outAss.salary
      ? outAss.salary.value
      : new Float64Array(months).fill(0);

    const startMonthVal = outAss.start ? outAss.start.value : 0;
    const startMonth = (startMonthVal instanceof Float64Array || Array.isArray(startMonthVal)) ? startMonthVal[0] : startMonthVal;

    const endMonthVal = outAss.end ? outAss.end.value : null;
    const endMonth = (endMonthVal instanceof Float64Array || Array.isArray(endMonthVal)) ? endMonthVal[0] : endMonthVal;

    // Calculate total cost and headcount arrays
    const costSeries = new Float64Array(months);
    const headsSeries = new Float64Array(months);

    // Only apply date range if dateRangeEnabled is true (AND logic)
    const dateRangeEnabled = cfg.dateRangeEnabled ?? true;
    const effectiveStart = (dateRangeEnabled && startMonth > 0) ? startMonth - 1 : 0;
    const effectiveEnd = (dateRangeEnabled && endMonth !== null && endMonth !== undefined) ? endMonth : months;

    for (let m = 0; m < months; m++) {
      if (m < effectiveStart || m >= effectiveEnd) {
        headsSeries[m] = 0;
        costSeries[m] = 0;
        continue;
      }
      headsSeries[m] = headCount[m];
      costSeries[m] = headCount[m] * salary[m];
    }

    return {
      heads: headsSeries,
      cost: costSeries
    };
  },

  // ==================================
  // StaffRole — for individual roles (CEO, CFO, etc.) where headcount is always 1
  // ==================================
  StaffRole(ctx, inputs, cfg) {
    const months = ctx.months;
    const outAss = cfg.output || {};

    // Only salary assumption - headcount is implicitly 1
    const salary = outAss.salary
      ? outAss.salary.value
      : new Float64Array(months).fill(0);

    const startMonthVal = outAss.start ? outAss.start.value : 0;
    const startMonth = (startMonthVal instanceof Float64Array || Array.isArray(startMonthVal)) ? startMonthVal[0] : startMonthVal;

    const endMonthVal = outAss.end ? outAss.end.value : null;
    const endMonth = (endMonthVal instanceof Float64Array || Array.isArray(endMonthVal)) ? endMonthVal[0] : endMonthVal;

    // Calculate total cost and headcount arrays
    const costSeries = new Float64Array(months);
    const headsSeries = new Float64Array(months);

    // Only apply date range if dateRangeEnabled is true (AND logic)
    const dateRangeEnabled = cfg.dateRangeEnabled ?? true;
    const effectiveStart = (dateRangeEnabled && startMonth > 0) ? startMonth - 1 : 0;
    const effectiveEnd = (dateRangeEnabled && endMonth !== null && endMonth !== undefined) ? endMonth : months;

    for (let m = 0; m < months; m++) {
      if (m < effectiveStart || m >= effectiveEnd) {
        headsSeries[m] = 0;
        costSeries[m] = 0;
        continue;
      }
      // Headcount is always 1 for a role
      headsSeries[m] = 1;
      costSeries[m] = salary[m];
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