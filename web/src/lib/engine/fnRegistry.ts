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
      : outAss.mix
        ? outAss.mix.value
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
    const cumSeries = new Float64Array(months);
    let runningTotal = 0;

    // Only apply date range if dateRangeEnabled is true (AND logic)
    const dateRangeEnabled = cfg.dateRangeEnabled ?? true;
    const effectiveStart = (dateRangeEnabled && startMonth > 0) ? startMonth - 1 : 0;
    const effectiveEnd = (dateRangeEnabled && endMonth !== null && endMonth !== undefined && endMonth > 0) ? endMonth : months;

    for (let m = 0; m < months; m++) {
      if (m < effectiveStart || m >= effectiveEnd) {
        outSeries[m] = 0;
      } else {
        outSeries[m] = baseInput[m] * factor[m];
      }

      // Apply overrides if present (so cum reflects them)
      if (cfg.overrides && cfg.overrides[channelName] && cfg.overrides[channelName][m] !== undefined) {
        outSeries[m] = Number(cfg.overrides[channelName][m]);
      }

      runningTotal += outSeries[m];
      cumSeries[m] = runningTotal;
    }

    // return BOTH: alias (convenience) + declared channel
    return {
      [alias]: outSeries,
      [channelName]: outSeries,
      val: outSeries, // Alias for QuantMul
      rev: outSeries, // Alias for RevMul
      cost: outSeries, // Alias for CostMul
      cum: cumSeries,
    };
  },

  // ==================================
  // Divide — used for QuantDiv etc. output = input / assum
  // ==================================
  Divide(ctx, inputs, cfg) {
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
    const cumSeries = new Float64Array(months);
    let runningTotal = 0;

    // Only apply date range if dateRangeEnabled is true (AND logic)
    const dateRangeEnabled = cfg.dateRangeEnabled ?? true;
    const effectiveStart = (dateRangeEnabled && startMonth > 0) ? startMonth - 1 : 0;
    const effectiveEnd = (dateRangeEnabled && endMonth !== null && endMonth !== undefined && endMonth > 0) ? endMonth : months;

    for (let m = 0; m < months; m++) {
      if (m < effectiveStart || m >= effectiveEnd) {
        outSeries[m] = 0;
      } else {
        // Handle division by zero
        const denominator = factor[m];
        outSeries[m] = (denominator === 0) ? 0 : (baseInput[m] / denominator);
      }

      // Apply overrides if present (so cum reflects them)
      if (cfg.overrides && cfg.overrides[channelName] && cfg.overrides[channelName][m] !== undefined) {
        outSeries[m] = Number(cfg.overrides[channelName][m]);
      }

      runningTotal += outSeries[m];
      cumSeries[m] = runningTotal;
    }

    // return BOTH: alias (convenience) + declared channel
    return {
      [alias]: outSeries,
      [channelName]: outSeries,
      cum: cumSeries,
    };
  },

  // ==================================
  // QuantStart — uses cfg.output.amount.value
  // ==================================
  QuantStart(ctx, _inputs, cfg) {
    const months = ctx.months;
    const outName = (cfg.outputNames && cfg.outputNames[0]) ? cfg.outputNames[0] : "val";
    const outAss = cfg.output || {};
    // Support multiple assumption names: value (Quant), cost (Cost), amount (Legacy Cost)
    const amount = outAss.value ? outAss.value.value
      : outAss.cost ? outAss.cost.value
        : outAss.amount ? outAss.amount.value
          : new Float64Array(months).fill(0);
    const startMonthVal = outAss.start ? outAss.start.value : 0;
    const startMonth = (startMonthVal instanceof Float64Array || Array.isArray(startMonthVal)) ? startMonthVal[0] : startMonthVal;

    const endMonthVal = outAss.end ? outAss.end.value : null;
    const endMonth = (endMonthVal instanceof Float64Array || Array.isArray(endMonthVal)) ? endMonthVal[0] : endMonthVal;

    // Only apply date range if dateRangeEnabled is true (AND logic)
    const dateRangeEnabled = cfg.dateRangeEnabled ?? true;
    const effectiveStart = (dateRangeEnabled && startMonth > 0) ? startMonth - 1 : 0;
    const effectiveEnd = (dateRangeEnabled && endMonth !== null && endMonth !== undefined && endMonth > 0) ? endMonth : months;

    const outSeries = new Float64Array(months);
    const cumSeries = new Float64Array(months);
    let runningTotal = 0;

    for (let m = 0; m < months; m++) {
      if (m < effectiveStart || m >= effectiveEnd) {
        outSeries[m] = 0;
      } else {
        outSeries[m] = amount[m];
      }

      // Apply overrides if present (so cum reflects them)
      // QuantStart usually maps to 'val' channel
      if (cfg.overrides && cfg.overrides['val'] && cfg.overrides['val'][m] !== undefined) {
        outSeries[m] = Number(cfg.overrides['val'][m]);
      }

      runningTotal += outSeries[m];
      cumSeries[m] = runningTotal;
    }

    return {
      [outName]: outSeries,
      val: outSeries,
      cost: outSeries, // Alias for Cost objects
      cum: cumSeries
    };
  },

  // ==================================
  // QuantPulse — creates a single month pulse
  // ==================================
  QuantPulse(ctx, _inputs, cfg) {
    const months = ctx.months;
    const outName = (cfg.outputNames && cfg.outputNames[0]) ? cfg.outputNames[0] : "val";
    const outAss = cfg.output || {};

    // Amount assumption
    const amount = outAss.value ? outAss.value.value : new Float64Array(months).fill(0);

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

      // Apply overrides if present
      if (cfg.overrides && cfg.overrides['val'] && cfg.overrides['val'][m] !== undefined) {
        outSeries[m] = Number(cfg.overrides['val'][m]);
      }

      runningTotal += outSeries[m];
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
    const effectiveEnd = (dateRangeEnabled && endMonth !== null && endMonth !== undefined && endMonth > 0) ? endMonth : months;

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
  // SubMth — uses cfg.output.churn.value, cfg.output.price.value and startMonth.value
  // ==================================
  SubMth(ctx, inputs, cfg) {
    const months = ctx.months;
    const outAss = cfg.output || {};

    // Get assumptions
    const churnMonthly = outAss.churn ? outAss.churn.value : new Float64Array(months).fill(0);
    const priceMonthly = outAss.price ? outAss.price.value : new Float64Array(months).fill(0);

    const startMonthVal = outAss.start ? outAss.start.value : 0;
    const startMonth = (startMonthVal instanceof Float64Array || Array.isArray(startMonthVal)) ? startMonthVal[0] : startMonthVal;

    const endMonthVal = outAss.end ? outAss.end.value : null;
    const endMonth = (endMonthVal instanceof Float64Array || Array.isArray(endMonthVal)) ? endMonthVal[0] : endMonthVal;

    // Input: New Customers
    const newCust = inputs[0] || new Float64Array(months).fill(0);

    const actSeries = new Float64Array(months);
    const chuSeries = new Float64Array(months);
    const revSeries = new Float64Array(months);

    // Only apply date range if dateRangeEnabled is true (AND logic)
    const dateRangeEnabled = cfg.dateRangeEnabled ?? true;
    const effectiveStart = (dateRangeEnabled && startMonth > 0) ? startMonth - 1 : 0;
    const effectiveEnd = (dateRangeEnabled && endMonth !== null && endMonth !== undefined && endMonth > 0) ? endMonth : months;

    let prevActive = 0;
    for (let m = 0; m < months; m++) {
      if (m < effectiveStart || m >= effectiveEnd) {
        actSeries[m] = 0;
        chuSeries[m] = 0;
        revSeries[m] = 0;
        prevActive = 0;
        continue;
      }

      const added = newCust[m] ?? 0;
      const rate = churnMonthly[m] ?? 0;
      const price = priceMonthly[m] ?? 0;

      const churned = prevActive * rate;
      let activeNow = prevActive + added - churned;
      if (activeNow < 0) activeNow = 0;

      actSeries[m] = activeNow;
      chuSeries[m] = churned;
      revSeries[m] = activeNow * price;

      prevActive = activeNow;
    }

    return {
      act: actSeries,
      chu: chuSeries,
      rev: revSeries
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
    // Support both 'months' (new) and 'delayMonths' (legacy)
    const delayArr = outAss.months ? outAss.months.value
      : outAss.delayMonths ? outAss.delayMonths.value
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
  // Advance inputs (shift forward in time)
  // ==================================
  Advance(ctx, inputs, cfg) {
    const months = ctx.months;
    const outName = (cfg.outputNames && cfg.outputNames[0]) ? cfg.outputNames[0] : "val";
    const outAss = cfg.output || {};

    // Support both 'months' and 'delayMonths' just in case
    const advanceArr = outAss.months ? outAss.months.value
      : outAss.delayMonths ? outAss.delayMonths.value
        : new Float64Array(months).fill(0);

    const src = inputs[0] || new Float64Array(months).fill(0);
    const out = new Float64Array(months);

    for (let m = 0; m < months; m++) {
      const d = Math.floor(advanceArr[m] ?? 0);
      // Shift forward: output at m comes from input at m + d
      // OR: input at m goes to output at m - d

      // Implementation: Input at m goes to m - d
      const target = m - d;
      if (target >= 0 && target < months) {
        out[target] += src[m];
      }
    }

    return { [outName]: out };
  },

  // ==================================
  // Ramp - ramp up values over time
  // ==================================
  Ramp(ctx, inputs, cfg) {
    const months = ctx.months;
    const outAss = cfg.output || {};

    // Assumptions
    const rampMonthsArr = outAss.months ? outAss.months.value : new Float64Array(months).fill(6);
    const startPercArr = outAss.startPerc ? outAss.startPerc.value : new Float64Array(months).fill(0);

    // Input: Max value per cohort (starting in month m)
    const src = inputs[0] || new Float64Array(months).fill(0);

    const valSeries = new Float64Array(months);
    const momSeries = new Float64Array(months);

    // Iterate through time (m)
    for (let m = 0; m < months; m++) {
      let currentVal = 0;

      // Iterate through cohorts (c) that started at or before m
      for (let c = 0; c <= m; c++) {
        const cohortMax = src[c];
        if (cohortMax !== 0) {
          const monthsSinceStart = m - c;

          // Get assumptions for this cohort (based on start month c)
          const rampMonths = rampMonthsArr[c];
          const startPerc = startPercArr[c];

          let percent = 1;
          if (monthsSinceStart < rampMonths) {
            // Linear interpolation
            // t=0: startPerc
            // t=rampMonths: 100%
            percent = startPerc + (1 - startPerc) * (monthsSinceStart / rampMonths);
          }

          currentVal += cohortMax * percent;
        }
      }
      valSeries[m] = currentVal;

      // Calculate MoM change
      const prevVal = (m > 0) ? valSeries[m - 1] : 0;
      momSeries[m] = currentVal - prevVal;
    }

    return {
      val: valSeries,
      mom: momSeries
    };
  },

  // ==================================
  // Spread - spread input over time
  // ==================================
  Spread(ctx, inputs, cfg) {
    const months = ctx.months;
    const outAss = cfg.output || {};
    const outName = (cfg.outputNames && cfg.outputNames[0]) ? cfg.outputNames[0] : "val";

    // Assumptions
    const durationArr = outAss.months ? outAss.months.value : new Float64Array(months).fill(12);

    // Input: Value to be spread starting in month m
    const src = inputs[0] || new Float64Array(months).fill(0);

    const out = new Float64Array(months);

    // Iterate through time (m)
    for (let m = 0; m < months; m++) {
      const valToSpread = src[m];
      if (valToSpread !== 0) {
        // Get duration for this cohort (based on start month m)
        // Round to nearest integer and ensure at least 1 month
        const duration = Math.max(1, Math.round(durationArr[m]));
        const monthlyVal = valToSpread / duration;

        // Add to output for duration months
        for (let i = 0; i < duration; i++) {
          const targetMonth = m + i;
          if (targetMonth < months) {
            out[targetMonth] += monthlyVal;
          }
        }
      }
    }

    return { [outName]: out };
  },

  // ==================================
  // FundDebt - Interest only debt funding
  // ==================================
  FundDebt(ctx, inputs, cfg) {
    const months = ctx.months;
    const outAss = cfg.output || {};

    // Assumptions (robust access)
    const startMonthVal = outAss.startMonth ? outAss.startMonth.value : 1;
    const startMonth = Math.max(1, Math.round((startMonthVal instanceof Float64Array || Array.isArray(startMonthVal)) ? startMonthVal[0] : startMonthVal));

    const amountVal = outAss.amount ? outAss.amount.value : 0;
    const amount = (amountVal instanceof Float64Array || Array.isArray(amountVal)) ? amountVal[0] : amountVal;

    const rateVal = outAss.rate ? outAss.rate.value : 0.01;
    const rate = (rateVal instanceof Float64Array || Array.isArray(rateVal)) ? rateVal[0] : rateVal;

    const termVal = outAss.term ? outAss.term.value : 12;
    const term = Math.max(1, Math.round((termVal instanceof Float64Array || Array.isArray(termVal)) ? termVal[0] : termVal));

    const raised = new Float64Array(months);
    const repaid = new Float64Array(months);
    const bal = new Float64Array(months);
    const int = new Float64Array(months);
    const debtMove = new Float64Array(months);

    if (amount !== 0) {
      // 0-indexed start month
      const m = startMonth - 1;

      if (m < months) {
        // 1. Debt Raised
        raised[m] = amount;
        debtMove[m] += amount;

        // 2. Debt Repaid (at end of term)
        const repayMonth = m + term;
        if (repayMonth < months) {
          repaid[repayMonth] = amount;
          debtMove[repayMonth] -= amount;
        }

        // 3. Interest and Balance
        // Interest is paid for each month the loan is active (from m to m + term - 1)
        for (let i = 0; i < term; i++) {
          const targetMonth = m + i;
          if (targetMonth < months) {
            bal[targetMonth] = amount;
            int[targetMonth] = amount * rate;
          }
        }
      }
    }

    return {
      raised,
      repaid,
      bal,
      int,
      debtMove
    };
  },

  // ==================================
  // CapexEquip - Equipment purchase based on demand
  // ==================================
  CapexEquip(ctx, inputs, cfg) {
    const months = ctx.months;
    const outAss = cfg.output || {};

    // Assumptions
    const productivity = outAss.productivity ? outAss.productivity.value : new Float64Array(months).fill(100);
    const price = outAss.price ? outAss.price.value : new Float64Array(months).fill(1000);
    const lifetime = outAss.lifetime ? outAss.lifetime.value : new Float64Array(months).fill(36);
    const residualValue = outAss.residualValue ? outAss.residualValue.value : new Float64Array(months).fill(0);

    // Input: Demand
    const demand = inputs[0] || new Float64Array(months).fill(0);

    const val = new Float64Array(months);
    const depr = new Float64Array(months);
    const nbuy = new Float64Array(months);
    const nown = new Float64Array(months);
    const nsell = new Float64Array(months);
    const res = new Float64Array(months);
    const writeOff = new Float64Array(months);
    const accumWriteOff = new Float64Array(months);

    // Track active cohorts: { amount, age, price, lifetime, residual }
    let cohorts: { amount: number; age: number; price: number; lifetime: number; residual: number }[] = [];

    for (let m = 0; m < months; m++) {
      const mProductivity = productivity[m];
      const mPrice = price[m];
      const mLifetime = Math.max(1, Math.round(lifetime[m]));
      const mResidual = residualValue[m];
      const mDemand = demand[m];

      // 1. Retire expired equipment
      // Check if any cohort reached its lifetime
      // Note: We increment age at the end of the month, so check age >= lifetime
      const activeCohorts = [];
      let currentUnits = 0;

      for (const cohort of cohorts) {
        if (cohort.age >= cohort.lifetime) {
          // Retire
          nsell[m] += cohort.amount;
          res[m] += cohort.amount * cohort.residual; // Use cohort's residual expectation? Or current? Usually original expectation or market. Using cohort's.

          // Write off gross asset value (negative)
          writeOff[m] -= cohort.amount * cohort.price;

          // Write off accumulated depreciation (negative)
          // Assuming fully depreciated at end of life
          accumWriteOff[m] -= cohort.amount * (cohort.price - cohort.residual);
          // Actually, if we depreciate down to residual, accum depr is (price - residual).
        } else {
          activeCohorts.push(cohort);
          currentUnits += cohort.amount;
        }
      }
      cohorts = activeCohorts;

      // 2. Calculate required units
      const requiredUnits = mProductivity > 0 ? Math.ceil(mDemand / mProductivity) : 0;

      // 3. Buy new equipment if needed
      if (requiredUnits > currentUnits) {
        const buyAmount = requiredUnits - currentUnits;
        nbuy[m] = buyAmount;
        val[m] = buyAmount * mPrice;

        cohorts.push({
          amount: buyAmount,
          age: 0,
          price: mPrice,
          lifetime: mLifetime,
          residual: mResidual
        });
        currentUnits += buyAmount;
      }

      nown[m] = currentUnits;

      // 4. Calculate Depreciation
      // Straight line: (Price - Residual) / Lifetime
      let monthlyDepr = 0;
      for (const cohort of cohorts) {
        if (cohort.age < cohort.lifetime) {
          const deprPerUnit = (cohort.price - cohort.residual) / cohort.lifetime;
          monthlyDepr += cohort.amount * deprPerUnit;
        }
      }
      depr[m] = monthlyDepr;

      // 5. Increment Age
      for (const cohort of cohorts) {
        cohort.age++;
      }
    }

    return {
      val,
      depr,
      nbuy,
      nown,
      nsell,
      res,
      writeOff,
      accumWriteOff
    };
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
    const effectiveEnd = (dateRangeEnabled && endMonth !== null && endMonth !== undefined && endMonth > 0) ? endMonth : months;

    for (let m = 0; m < months; m++) {
      if (m < effectiveStart || m >= effectiveEnd) {
        headsSeries[m] = 0;
        costSeries[m] = 0;
        continue;
      }
      // Headcount = activity ÷ productivity
      const headCount = productivity[m] > 0 ? activity[m] / productivity[m] : 0;
      headsSeries[m] = headCount;

      // Apply overrides to heads if present
      if (cfg.overrides && cfg.overrides['heads'] && cfg.overrides['heads'][m] !== undefined) {
        headsSeries[m] = Number(cfg.overrides['heads'][m]);
      }

      costSeries[m] = headsSeries[m] * salary[m];
    }

    return {
      heads: headsSeries,
      cost: costSeries
    };
  },

  // ==================================
  // StaffMul — calculates headcount from locations * heads per location
  // ==================================
  StaffMul(ctx, inputs, cfg) {
    const months = ctx.months;
    const outAss = cfg.output || {};

    // Extract the two assumptions
    const headsPerLoc = outAss.heads
      ? outAss.heads.value
      : new Float64Array(months).fill(0);
    const salary = outAss.salary
      ? outAss.salary.value
      : new Float64Array(months).fill(0);

    const startMonthVal = outAss.start ? outAss.start.value : 0;
    const startMonth = (startMonthVal instanceof Float64Array || Array.isArray(startMonthVal)) ? startMonthVal[0] : startMonthVal;

    const endMonthVal = outAss.end ? outAss.end.value : null;
    const endMonth = (endMonthVal instanceof Float64Array || Array.isArray(endMonthVal)) ? endMonthVal[0] : endMonthVal;

    // Get the input activity (first input)
    const locations = inputs[0] || new Float64Array(months).fill(0);

    // Calculate headcount and cost arrays
    const headsSeries = new Float64Array(months);
    const costSeries = new Float64Array(months);

    // Only apply date range if dateRangeEnabled is true (AND logic)
    const dateRangeEnabled = cfg.dateRangeEnabled ?? true;
    const effectiveStart = (dateRangeEnabled && startMonth > 0) ? startMonth - 1 : 0;
    const effectiveEnd = (dateRangeEnabled && endMonth !== null && endMonth !== undefined && endMonth > 0) ? endMonth : months;

    for (let m = 0; m < months; m++) {
      if (m < effectiveStart || m >= effectiveEnd) {
        headsSeries[m] = 0;
        costSeries[m] = 0;
        continue;
      }
      // Headcount = locations * heads per location
      const headCount = locations[m] * headsPerLoc[m];
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
    const effectiveEnd = (dateRangeEnabled && endMonth !== null && endMonth !== undefined && endMonth > 0) ? endMonth : months;

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
    const effectiveEnd = (dateRangeEnabled && endMonth !== null && endMonth !== undefined && endMonth > 0) ? endMonth : months;

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