// @ts-nocheck
// buildModelAssumptions.mjs

export function buildModelAssumptions(ast, index, objectSchema, ctx = { months: 24, years: 2 }) {
  const result = {};

  for (const obj of ast.objects) {
    const typeName = obj.fnName;
    const schema = objectSchema[typeName];
    if (!schema) {
      // object type not in schema — still create empty
      result[obj.name] = { object: {}, outputs: {} };
      continue;
    }

    const objAss = { object: {}, outputs: {} };

    // 1) object-level assumptions
    const objectDefs = (schema.assumptions && schema.assumptions.object) || [];
    for (const def of objectDefs) {
      objAss.object[def.name] = buildAssumptionField(def, ctx);
    }

    // 2) per-output assumptions
    const outputAliases =
      (obj.outputs && obj.outputs.length ? obj.outputs : (index.outputsByObject.get(obj.name) || []))
        .filter(Boolean);

    const outputDefs = (schema.assumptions && schema.assumptions.output) || [];

    for (const alias of outputAliases) {
      const outAss = {};
      for (const def of outputDefs) {
        outAss[def.name] = buildAssumptionField(def, ctx);
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
function buildAssumptionField(def, ctx) {
  const months = ctx.months ?? 60;
  const years = ctx.years ?? Math.ceil(months / 12);

  const raw = {
    single: def.default ?? null,
    annual: Array.from({ length: years }, () => null),
    monthly: Array.from({ length: months }, () => null),
    growth: null,         // annual growth/inflation, e.g. 0.05 = 5% per year
    smoothing: def.supports?.smoothing ? true : false,
    dateRange: null       // could be { start: 0, end: 59 }
  };

  // prefill annual if default is meaningful and annual is supported
  if (def.supports?.annual && typeof def.default === "number") {
    raw.annual = Array.from({ length: years }, () => def.default);
  }

  const value = materializeMonthly(def, raw, ctx);

  return {
    raw,
    value,
    label: def.label ?? def.name,
    baseType: def.baseType ?? "number",
    supports: def.supports
  };
}

/**
 * The shared pipeline that turns raw {single, annual, monthly, growth, smoothing, dateRange}
 * into a monthly array.
 */
function materializeMonthly(def, raw, ctx) {
  const months = ctx.months ?? 60;
  const years = ctx.years ?? Math.ceil(months / 12);

  // 1) start with zeros
  const out = new Float64Array(months);

  // if it's a boolean or a plain number with no monthly/annual, just return the scalar
  if (def.baseType === "boolean") {
    return raw.single ?? false;
  }

  // 2) growth path (alternative to annual): single + annual growth
  if (def.supports?.growth && raw.growth != null) {
    const base = raw.single != null ? raw.single : 0;
    const annualGrowth = raw.growth; // e.g. 0.06
    // convert to monthly compound
    const monthlyGrowth = Math.pow(1 + annualGrowth, 1 / 12) - 1;
    for (let m = 0; m < months; m++) {
      if (m === 0) {
        out[m] = base;
      } else {
        out[m] = out[m - 1] * (1 + monthlyGrowth);
      }
    }
  } else if (def.supports?.annual && raw.annual?.length) {
    // 3) annual path
    for (let y = 0; y < years; y++) {
      const yearVal = raw.annual[y];
      for (let m = 0; m < 12; m++) {
        const idx = y * 12 + m;
        if (idx >= months) break;
        out[idx] = yearVal != null ? yearVal : 0;
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
          out[idx] = startVal + step * m;
        }
      }
    }
  } else if (def.supports?.single && raw.single != null) {
    // 4) single value path
    for (let m = 0; m < months; m++) {
      out[m] = raw.single;
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
  if (raw.dateRange && typeof raw.dateRange === "object") {
    const start = raw.dateRange.start ?? 0;
    const end = raw.dateRange.end ?? (months - 1);
    for (let m = 0; m < months; m++) {
      if (m < start || m > end) {
        out[m] = 0;
      }
    }
  }

  return out;
}

function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Float64Array) return new Float64Array(obj);
  if (Array.isArray(obj)) return obj.map(deepClone);
  const copy = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copy[key] = deepClone(obj[key]);
    }
  }
  return copy;
}

export function updateAssumption(assumptions, objName, type, aliasOrName, fieldName, value, ctx) {
  const newAssumptions = deepClone(assumptions);

  let targetField;
  if (type === 'object') {
    targetField = newAssumptions[objName]?.object?.[fieldName];
  } else {
    targetField = newAssumptions[objName]?.outputs?.[aliasOrName]?.[fieldName];
  }

  if (!targetField) {
    console.warn(`Assumption not found: ${objName} ${type} ${aliasOrName} ${fieldName}`);
    return assumptions;
  }

  // Update raw value (assuming single for now)
  targetField.raw.single = value;

  // If annual is supported, also update annual array to match single
  // This is necessary because materializeMonthly prioritizes annual over single
  if (targetField.supports?.annual && Array.isArray(targetField.raw.annual)) {
    targetField.raw.annual.fill(value);
  }

  // Re-materialize value
  const def = {
    baseType: targetField.baseType,
    supports: targetField.supports
  };

  targetField.value = materializeMonthly(def, targetField.raw, ctx);

  return newAssumptions;
}