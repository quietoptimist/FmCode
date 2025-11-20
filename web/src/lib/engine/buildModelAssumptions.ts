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
    growth: Array.from({ length: years }, () => 0), // Array for YoY growth, init to 0
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
  // Actually, growth mode updates raw.annual, so we can just rely on raw.annual logic below.
  // But if we want to support calculating FROM growth:
  // We should probably ensure raw.annual is always the source of truth for calculation,
  // and raw.growth is just a UI state that updates raw.annual.
  // HOWEVER, the user said: "the % determine the annual values if in % mode"
  // So let's support calculating annual FROM growth if needed, but syncing is better.
  // Let's assume raw.annual is always up to date.

  if (def.supports?.annual && raw.annual?.length) {
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

export function updateAssumption(assumptions, objName, type, aliasOrName, fieldName, value, ctx, subField = null, index = null) {
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

  } else if (subField === 'smoothing') {
    targetField.raw.smoothing = value;
  } else {
    // Default: Update single value
    targetField.raw.single = value;

    // Sync Annual: Fill all years with single value
    if (targetField.supports?.annual && Array.isArray(targetField.raw.annual)) {
      targetField.raw.annual.fill(value);
      targetField.raw.growth.fill(0); // Constant means 0 growth
    }
  }

  // Re-materialize value
  const def = {
    baseType: targetField.baseType,
    supports: targetField.supports
  };

  targetField.value = materializeMonthly(def, targetField.raw, ctx);

  return newAssumptions;
}