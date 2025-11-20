export function showObjectsWithRows(
  store,
  index,
  assumptions = null,
  objectSchema = null,
  monthsToShow = 6
) {
  console.log("\n=== Model outputs by object ===");

  //set padding width
  const padChars = 40;

  for (const [objectName, aliases] of index.outputsByObject.entries()) {
    console.log(objectName);
    console.log("-".repeat(objectName.length));

    // 1) ASSUMPTIONS FIRST
    if (assumptions && assumptions[objectName]) {
      const objAss = assumptions[objectName];
      console.log("  (assumptions)");
      // object-level
      for (const [name, field] of Object.entries(objAss.object || {})) {
        logAssumptionField(`    [object] ${name}`, field, monthsToShow, padChars);
      }
      // per-output
      for (const alias of aliases) {
        const outAss = objAss.outputs?.[alias];
        if (!outAss) continue;
        console.log(`    [output] ${alias}`);
        for (const [name, field] of Object.entries(outAss)) {
          logAssumptionField(`      ${name}`, field, monthsToShow);
        }
      }
    }

    // 2) ROWS + CHANNELS
    for (const alias of aliases) {
      const aliasKeys = [...store.keys()].filter(k => k.startsWith(`${alias}.`));
      if (aliasKeys.length === 0) {
        console.log(`  ${alias}.(no channels)`);
        continue;
      }

      for (const key of aliasKeys) {
        const arr = store.get(key);
        if (!(arr instanceof Float64Array)) continue;
        const sample = Array.from(arr.slice(0, monthsToShow)).map(v => +v.toFixed(2));
        console.log(`  ${key}`.padEnd(padChars) + sample.join(", ") + (arr.length > monthsToShow ? ", ..." : ""));
      }
    }

    // 3) OBJECT-LEVEL TOTALS (all channels)
    const objectChannelKeys = [...store.keys()].filter(k => k.startsWith(`${objectName}.`));
    for (const key of objectChannelKeys) {
      const arr = store.get(key);
      if (!(arr instanceof Float64Array)) continue;
      const sample = Array.from(arr.slice(0, monthsToShow)).map(v => +v.toFixed(2));
      console.log(`  ${key}`.padEnd(padChars) + sample.join(", ") + (arr.length > monthsToShow ? ", ..." : ""));
    }

    console.log(); // blank line
  }
}

function logAssumptionField(label, field, monthsToShow, padChars) {
  if (!field) {
    console.log(label, "(missing)");
    return;
  }

  // booleans / scalars
  if (field.baseType === "boolean" || typeof field.value === "boolean" || typeof field.value === "number") {
    console.log(label.padEnd(padChars), field.value);
    return;
  }

  // arrays / monthly series
  if (field.value instanceof Float64Array || Array.isArray(field.value)) {
    const arr = field.value;
    const sample = Array.from(arr.slice(0, monthsToShow)).map(v =>
      v != null && !Number.isNaN(v) ? +v.toFixed(4) : v
    );
    console.log(label.padEnd(padChars) + ": " + sample.join(", ") + (arr.length > monthsToShow ? ", ..." : ""));
    return;
  }

  // fallback
  console.log(label.padEnd(padChars), field.value);
}