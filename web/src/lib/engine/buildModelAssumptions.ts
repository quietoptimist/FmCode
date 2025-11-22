
// buildModelAssumptions.mjs

export function buildModelAssumptions(ast: any, index: any, objectSchema: any, ctx = { months: 24, years: 2 }) {
  const result: any = {};

  for (const obj of ast.objects) {
    const typeName = obj.fnName;
    const schema = objectSchema[typeName];
    if (!schema) {
      // object type not in schema — still create empty
      result[obj.name] = { object: {}, outputs: {} };
      continue;
    }

    const objAss: any = { object: {}, outputs: {}, uiMode: 'single', seasonalEnabled: false, dateRangeEnabled: false };

    // 1) object-level assumptions
    const objectDefs = (schema.assumptions && schema.assumptions.object) || [];
    for (const def of objectDefs) {
      objAss.object[def.name] = buildAssumptionField(def, ctx, false); // object-level doesn't use seasonal
    }

    // 2) per-output assumptions
    const outputAliases =
      (obj.outputs && obj.outputs.length ? obj.outputs : (index.outputsByObject.get(obj.name) || []))
        .filter(Boolean);

    const outputDefs = (schema.assumptions && schema.assumptions.output) || [];

    for (const alias of outputAliases) {
      const outAss: any = {};
      for (const def of outputDefs) {
        outAss[def.name] = buildAssumptionField(def, ctx, objAss.seasonalEnabled ?? false);
      }
      objAss.outputs[alias] = outAss;
    }

    result[obj.name] = objAss;
  }

  return result;
}

/**
 * Build one assumption field = { raw: {...}, value: ... , label, baseType }
 */
function buildAssumptionField(def: any, ctx: any, seasonalEnabled: boolean = false) {
  const months = ctx.months ?? 60;
  const years = ctx.years ?? Math.ceil(months / 12);

  const raw: any = {
    annual: Array.from({ length: years }, () => null),
    monthly: Array.from({ length: months }, () => null),
    growth: Array.from({ length: years }, () => 0), // Array for YoY growth, init to 0
    seasonal: Array.from({ length: 12 }, () => 1 / 12), // 12 monthly factors, default to equal distribution
    smoothing: def.supports?.smoothing ? true : false,
    dateRange: null       // could be { start: 0, end: 59 }
  };

  // prefill annual if default is meaningful and annual is supported
  if (def.supports?.annual && typeof def.default === "number") {
    raw.annual = Array.from({ length: years }, () => def.default);
  }

  const value = materializeMonthly(def, raw, ctx, seasonalEnabled, 'single'); // Default to single mode on init

  return {
    raw,
    value,
    label: def.label ?? def.name,
    baseType: def.baseType ?? "number",
    isRate: def.isRate, // Propagate isRate flag
    supports: def.supports
  };
}

/**
 * The shared pipeline that turns raw {annual, monthly, growth, smoothing, dateRange}
 * into a monthly array.
 * @param uiMode - The UI mode: 'single', 'annual', or 'growth'
 */
function materializeMonthly(def: any, raw: any, ctx: any, seasonalEnabled: boolean = false, uiMode: 'single' | 'annual' | 'growth' = 'single', dateRangeEnabled: boolean = false) {
  const months = ctx.months ?? 60;
  const years = ctx.years ?? Math.ceil(months / 12);

  // 1) start with zeros
  const out = new Float64Array(months);

  // if it's a boolean or a plain number with no monthly/annual, just return the scalar
  if (def.baseType === "boolean") {
    return raw.annual?.[0] ?? false;
  }

  // In single mode, only use annual[0] for all months - ignore other years and smoothing
  if (uiMode === 'single') {
    const singleVal = raw.annual?.[0] ?? 0;

    // Apply seasonal if enabled
    if (seasonalEnabled && def.supports?.seasonal && raw.seasonal) {
      for (let m = 0; m < months; m++) {
        const monthIdx = m % 12; // Repeat seasonal pattern
        const factor = raw.seasonal[monthIdx] ?? (1 / 12);
        out[m] = singleVal * factor;
      }
    } else {
      // Check if this is a rate (don't divide) or a total (divide by 12)
      const monthlyVal = def.isRate ? singleVal : singleVal / 12;
      for (let m = 0; m < months; m++) {
        out[m] = monthlyVal;
      }
    }

    // Apply monthly overrides  
    if (def.supports?.monthly && Array.isArray(raw.monthly)) {
      for (let m = 0; m < months; m++) {
        if (raw.monthly[m] != null) {
          out[m] = raw.monthly[m];
        }
      }
    }

    return out;
  }

  // Annual/Growth mode: use multi-year logic

  if (def.supports?.annual && raw.annual?.length) {
    // 3) annual path
    for (let y = 0; y < years; y++) {
      const yearVal = raw.annual[y];
      for (let m = 0; m < 12; m++) {
        const idx = y * 12 + m;
        if (idx >= months) break;

        let val = yearVal != null ? yearVal : 0;

        // Apply seasonal factors if enabled and supported
        if (seasonalEnabled && def.supports?.seasonal && raw.seasonal) {
          const monthIdx = m; // 0-11
          const factor = raw.seasonal[monthIdx] ?? (1 / 12);
          val = val * factor;
        } else {
          // For non-seasonal, check if rate or total
          val = def.isRate ? val : val / 12;
        }

        out[idx] = val;
      }
    }

    // 3b) smoothing between years
    if (def.supports?.smoothing && raw.smoothing) {
      for (let y = 0; y < years - 1; y++) {
        const startIdx = y * 12;
        const endIdx = (y + 1) * 12;
        const startVal = raw.annual[y] ?? 0;
        const endVal = raw.annual[y + 1] ?? startVal;
        const step = (endVal - startVal) / 12;

        for (let m = 0; m < 12; m++) {
          const idx = startIdx + m;
          if (idx >= months) break;

          // Calculate smoothed annual value for this month
          const smoothedAnnual = startVal + step * m;

          // Apply seasonal factors if enabled
          if (seasonalEnabled && def.supports?.seasonal && raw.seasonal) {
            const monthIdx = m; // 0-11
            const factor = raw.seasonal[monthIdx] ?? (1 / 12);
            out[idx] = smoothedAnnual * factor;
          } else {
            // For non-seasonal, check if rate or total
            out[idx] = def.isRate ? smoothedAnnual : smoothedAnnual / 12;
          }
        }
      }
    }
  } else {
    // 4) fallback: use first year value for all months (single mode behavior)
    const singleVal = raw.annual?.[0] ?? 0;
    for (let m = 0; m < months; m++) {
      out[m] = singleVal;
    }
  }

  // 5) apply monthly overrides
  if (def.supports?.monthly && Array.isArray(raw.monthly)) {
    for (let m = 0; m < months; m++) {
      if (raw.monthly[m] != null) {
        out[m] = raw.monthly[m];
      }
    }
  }

  // 6) apply date range (if any)
  // 6) apply date range (if enabled and exists)
  if (dateRangeEnabled && def.supports?.dateRange && raw.dateRange && typeof raw.dateRange === "object") {
    const start = raw.dateRange.start ?? 1; // Default to Month 1 (1-based)
    const end = raw.dateRange.end ?? months;
    for (let m = 0; m < months; m++) {
      // Logic: m is 0-based index. Month number is m+1.
      // If Month number < start OR Month number > end, zero it out.
      if ((m + 1) < start || (m + 1) > end) {
        out[m] = 0;
      }
    }
  }

  return out;
}

function deepClone(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Float64Array) return new Float64Array(obj);
  if (Array.isArray(obj)) return obj.map(deepClone);
  const copy: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copy[key] = deepClone(obj[key]);
    }
  }
  return copy;
}

export function updateAssumption(assumptions: any, objName: string, type: string, aliasOrName: string, fieldName: string, value: any, ctx: any, subField: string | null = null, index: number | null = null) {
  const newAssumptions = deepClone(assumptions);

  let targetField;
  let seasonalEnabled = newAssumptions[objName]?.seasonalEnabled ?? false;
  let dateRangeEnabled = newAssumptions[objName]?.dateRangeEnabled ?? false;

  if (type === 'meta') {
    if (fieldName === 'uiMode') {
      if (newAssumptions[objName]) {
        newAssumptions[objName].uiMode = value;

        // Re-materialize ALL outputs of this object with the new uiMode
        const obj = newAssumptions[objName];
        if (obj.outputs) {
          for (const alias in obj.outputs) {
            const outAss = obj.outputs[alias];
            for (const fName in outAss) {
              const field = outAss[fName];
              const def = {
                baseType: field.baseType, isRate: field.isRate,
                supports: field.supports
              };
              field.value = materializeMonthly(def, field.raw, ctx, seasonalEnabled, value, dateRangeEnabled);
            }
          }
        }
      }
      return newAssumptions;
    }
    if (fieldName === 'seasonalEnabled') {
      if (newAssumptions[objName]) {
        newAssumptions[objName].seasonalEnabled = value;
        seasonalEnabled = value; // Update local var for re-calc

        // We need to trigger re-materialization for ALL outputs of this object
        // because the flag is object-level but affects output calculations.
        const obj = newAssumptions[objName];
        if (obj.outputs) {
          for (const alias in obj.outputs) {
            const outAss = obj.outputs[alias];
            for (const fName in outAss) {
              const field = outAss[fName];
              // Re-materialize
              const def = {
                baseType: field.baseType, isRate: field.isRate,
                supports: field.supports
              };
              const uiMode = obj.uiMode || 'single';
              field.value = materializeMonthly(def, field.raw, ctx, seasonalEnabled, uiMode);
            }
          }
        }
      }
      return newAssumptions;
    }
    if (fieldName === 'dateRangeEnabled') {
      if (newAssumptions[objName]) {
        newAssumptions[objName].dateRangeEnabled = value;
        dateRangeEnabled = value; // Update local var

        // Re-materialize ALL outputs
        const obj = newAssumptions[objName];
        if (obj.outputs) {
          for (const alias in obj.outputs) {
            const outAss = obj.outputs[alias];
            for (const fName in outAss) {
              const field = outAss[fName];
              const def = {
                baseType: field.baseType, isRate: field.isRate,
                supports: field.supports
              };
              const uiMode = obj.uiMode || 'single';
              field.value = materializeMonthly(def, field.raw, ctx, seasonalEnabled, uiMode, dateRangeEnabled);
            }
          }
        }
      }
      return newAssumptions;
    }
  } else if (type === 'object') {
    targetField = newAssumptions[objName]?.object?.[fieldName];
  } else {
    targetField = newAssumptions[objName]?.outputs?.[aliasOrName]?.[fieldName];
  }

  if (!targetField) {
    console.warn(`Assumption not found: ${objName} ${type} ${aliasOrName} ${fieldName}`);
    return assumptions;
  }

  // Ensure growth array exists if we are about to use it
  if (!Array.isArray(targetField.raw.growth)) {
    const years = ctx.years ?? 2;
    targetField.raw.growth = Array.from({ length: years }, () => 0);
  }

  // Handle different update types
  if (subField === 'annual' && index !== null) {
    // Updating a specific year in annual array
    targetField.raw.annual[index] = value;

    // Sync Growth: Calculate growth based on new annual values
    // Growth[i] = (Annual[i] - Annual[i-1]) / Annual[i-1]
    // Growth[0] is usually 0 or undefined relative to previous. Let's keep it 0.
    if (index > 0) {
      const prev = targetField.raw.annual[index - 1] || 0;
      if (prev !== 0) {
        targetField.raw.growth[index] = (value - prev) / prev;
      } else {
        targetField.raw.growth[index] = 0;
      }
    }
    // Also update next year's growth if it exists
    if (index < targetField.raw.annual.length - 1) {
      const next = targetField.raw.annual[index + 1] || 0;
      if (value !== 0) {
        targetField.raw.growth[index + 1] = (next - value) / value;
      }
    }

  } else if (subField === 'growth' && index !== null) {
    // Updating a specific year in growth array
    targetField.raw.growth[index] = value;

    // Sync Annual: Recalculate annual values based on growth
    // If index 0 changed (base), it's weird for growth. Usually growth is from year 1.
    // But if we treat growth[0] as 0, then changing it does nothing?
    // Let's assume growth applies to the previous year.
    // So Annual[i] = Annual[i-1] * (1 + Growth[i])
    // We need to propagate this change forward.

    for (let i = Math.max(1, index); i < targetField.raw.annual.length; i++) {
      const prev = targetField.raw.annual[i - 1] || 0;
      const g = targetField.raw.growth[i] || 0;
      targetField.raw.annual[i] = prev * (1 + g);
    }

  } else if (subField === 'seasonal' && index !== null) {
    targetField.raw.seasonal[index] = value;
  } else if (subField === 'smoothing') {
    targetField.raw.smoothing = value;
  } else if (subField === 'dateRange') {
    targetField.raw.dateRange = value;
  } else {
    // Default: Update first year (single mode behavior)
    // Set annual[0] to the value and fill remaining years with same value
    if ((targetField.supports?.annual || targetField.supports?.single) && Array.isArray(targetField.raw.annual)) {
      targetField.raw.annual.fill(value);
      targetField.raw.growth.fill(0); // Constant means 0 growth
    }
  }

  // Re-materialize value
  const def = {
    baseType: targetField.baseType,
    isRate: targetField.isRate,
    supports: targetField.supports
  };
  const uiMode = newAssumptions[objName]?.uiMode || 'single';

  targetField.value = materializeMonthly(def, targetField.raw, ctx, seasonalEnabled, uiMode, dateRangeEnabled);

  return newAssumptions;
}

export function recalculateAll(assumptions: any, ctx: any) {
  for (const objName in assumptions) {
    const obj = assumptions[objName];
    if (!obj) continue;

    const seasonalEnabled = obj.seasonalEnabled ?? false;
    const dateRangeEnabled = obj.dateRangeEnabled ?? false;
    const uiMode = obj.uiMode ?? 'single';

    // Object-level assumptions
    if (obj.object) {
      for (const fName in obj.object) {
        const field = obj.object[fName];
        if (field && field.raw) {
          const def = {
            baseType: field.baseType,
            isRate: field.isRate,
            supports: field.supports
          };
          field.value = materializeMonthly(def, field.raw, ctx, seasonalEnabled, uiMode, dateRangeEnabled);
        }
      }
    }

    // Output assumptions
    if (obj.outputs) {
      for (const alias in obj.outputs) {
        const outAss = obj.outputs[alias];
        for (const fName in outAss) {
          const field = outAss[fName];
          if (field && field.raw) {
            const def = {
              baseType: field.baseType,
              isRate: field.isRate,
              supports: field.supports
            };
            field.value = materializeMonthly(def, field.raw, ctx, seasonalEnabled, uiMode, dateRangeEnabled);
          }
        }
      }
    }
  }
  return assumptions;
}