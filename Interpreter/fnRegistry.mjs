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

    const outAss  = cfg.output || {};
    const factor  = outAss.factor
      ? outAss.factor.value
      : new Float64Array(months).fill(1);
    const startMonth = outAss.startMonth
      ? outAss.startMonth.value
      : 0;

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
    const outAss  = cfg.output || {};
    const amount  = outAss.amount ? outAss.amount.value : new Float64Array(months).fill(0);
    const startMonth = outAss.startMonth ? outAss.startMonth.value : 0;

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
    const outAss  = cfg.output || {};
    const churnMonthly = outAss.churnRate ? outAss.churnRate.value : new Float64Array(months).fill(0);
    const startMonth   = outAss.startMonth ? outAss.startMonth.value : 0;

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
      const added   = newCust[m] ?? 0;
      const rate    = churnMonthly[m] ?? 0;
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
    const outAss  = cfg.output || {};

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

  Setup(ctx) {
    return { val: new Float64Array(ctx.months) };
  },
};