// @ts-nocheck
// engine.mjs
export function runEngine({ ast, index, outGraph, assumptions, ctx, fnRegistry, objectSchema, overrides }) {
  const store = new Map();
  const byAlias = new Map();

  // use the LINKED nodes (spreads already expanded)
  const linkedByName = new Map(ast.objects.map(n => [n.name, n]));

  // ------------- MAIN LOOP: run each alias in topo order -------------
  for (const alias of outGraph.order) {
    const objName = outGraph.aliasOwner(alias);
    const objNode = linkedByName.get(objName);
    if (!objNode) throw new Error(`Engine: no AST node for object "${objName}"`);

    // figure out this object's outputs and which index we're on
    const objOutputs =
      (objNode.outputs && objNode.outputs.length ? objNode.outputs : (index.outputsByObject.get(objName) || []))
        .filter(Boolean);
    const outputIndex = objOutputs.indexOf(alias);
    if (outputIndex === -1) {
      throw new Error(`Engine: alias "${alias}" not found in object "${objName}" outputs`);
    }

    const args = objNode.args;
    const hasSpreadArgs = args.some(a => a && a.fromSpreadOf);
    const singleNonSpreadForAll =
      !hasSpreadArgs &&
      args.length === 1 &&
      objOutputs.length > 1;

    // --------------------- 1) collect inputs ---------------------
    const inputs = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      // decide whether this arg applies to THIS output
      let applies = false;
      if (singleNonSpreadForAll) {
        applies = true;
      } else if (objOutputs.length === 1) {
        applies = true;
      } else if (hasSpreadArgs) {
        if (i === outputIndex) {
          applies = true;
        } else if (i >= objOutputs.length && outputIndex === objOutputs.length - 1) {
          applies = true;
        }
      } else {
        if (i === outputIndex) {
          applies = true;
        } else if (i >= objOutputs.length && outputIndex === objOutputs.length - 1) {
          applies = true;
        }
      }

      if (!applies) continue;

      if (arg.kind === 'ref') {
        // ref could be an alias or an object
        if (index.aliases.has(arg.name)) {
          const key = `${arg.name}.${arg.field}`;
          const series = store.get(key);
          if (!series) {
            // 👇 better error message
            const have = [...store.keys()];
            throw new Error(
              `Engine: missing input "${key}" for ${objName}.${alias} (arg #${i}). ` +
              `Store currently has: ${have.join(', ')}`
            );
          }
          inputs.push(series);
        } else if (index.objectsByName.has(arg.name)) {
          // object level ref: sum same channel across all of its outputs
          const srcAliases = index.outputsByObject.get(arg.name) || [];
          if (srcAliases.length === 0) {
            throw new Error(
              `Engine: reference to object "${arg.name}" but it has no outputs (used in ${objName}.${alias})`
            );
          }
          const combined = new Float64Array(ctx.months);
          for (const srcAlias of srcAliases) {
            const key = `${srcAlias}.${arg.field}`;
            const series = store.get(key);
            if (!series) {
              const have = [...store.keys()];
              throw new Error(
                `Engine: missing input "${key}" (expanded from object "${arg.name}") for ${objName}.${alias} (arg #${i}). ` +
                `Store currently has: ${have.join(', ')}`
              );
            }
            for (let m = 0; m < ctx.months; m++) {
              combined[m] += series[m];
            }
          }
          inputs.push(combined);
        } else {
          throw new Error(
            `Engine: unknown reference "${arg.name}.${arg.field}" for ${objName}.${alias} (arg #${i}).`
          );
        }
      } else if (arg.kind === 'literal') {
        const arr = new Float64Array(ctx.months);
        const v = Number.isFinite(arg.value) ? arg.value : 0;
        for (let m = 0; m < ctx.months; m++) arr[m] = v;
        inputs.push(arr);
      }
    }

    // --------------------- 2) unwrap assumptions ---------------------
    const objAss = assumptions[objName] || { object: {}, outputs: {} };

    const objectLevel = {};
    for (const [k, v] of Object.entries(objAss.object)) {
      objectLevel[k] = v.value;
    }
    console.log(`[Engine] Unwrapped assumptions for ${objName}:`, objectLevel);

    const outputAss = objAss.outputs[alias] || {};
    console.log(`[Engine] Output assumptions for ${objName}.${alias}:`, outputAss);

    // we MUST have channels in schema
    const schema = objectSchema[objNode.fnName];
    if (!schema || !schema.channels) {
      throw new Error(
        `Engine: object type "${objNode.fnName}" has no channels in objectSchema. Add channels to objectSchema.mjs.`
      );
    }
    const declaredChannels = Object.keys(schema.channels);
    if (declaredChannels.length === 0) {
      throw new Error(
        `Engine: object type "${objNode.fnName}" declares zero channels in objectSchema. Add at least one.`
      );
    }

    // --------------------- 3) call function ---------------------
    const implName =
      (objectSchema && objectSchema[objNode.fnName] && objectSchema[objNode.fnName].impl)
        ? objectSchema[objNode.fnName].impl
        : objNode.fnName;

    const fn = fnRegistry[implName];
    if (!fn) throw new Error(`Engine: unknown function "${implName}" (from "${objNode.fnName}")`);

    const result = fn(ctx, inputs, {
      object: objectLevel,
      output: outputAss,
      channels: schema.channels,
      outputNames: [alias],
      outputIndex,
    }) || {};

    // --------------------- 4) store results (strict) ---------------------
    const resultEntries = Object.entries(result).filter(([, v]) => v instanceof Float64Array);
    const returnedNames = resultEntries.map(([k]) => k);

    // Helper to apply overrides
    const applyOverrides = (channelName, series) => {
      if (overrides && overrides[alias] && overrides[alias][channelName]) {
        const channelOverrides = overrides[alias][channelName];
        for (const [mStr, val] of Object.entries(channelOverrides)) {
          const m = parseInt(mStr, 10);
          if (!isNaN(m) && m >= 0 && m < series.length) {
            series[m] = Number(val);
          }
        }
      }
    };

    // Did the function return any of the declared channels explicitly?
    const returnedADeclaredChannel = returnedNames.some(n => declaredChannels.includes(n));

    if (returnedADeclaredChannel) {
      // store only declared channels
      for (const [name, series] of resultEntries) {
        if (!declaredChannels.includes(name)) {
          // ignore alias-only keys here
          continue;
        }
        applyOverrides(name, series);
        store.set(`${alias}.${name}`, series);
      }
    } else {
      // function returned only alias (or alias + non-declared names)
      const aliasSeries = result[alias] || result.val;
      if (!aliasSeries) {
        const have = Object.keys(result);
        throw new Error(
          `Engine: function for "${objName}" did not return any declared channels (${declaredChannels.join(', ')}) ` +
          `and also did not return an alias series (${alias}). It returned: ${have.join(', ')}`
        );
      }
      if (declaredChannels.length === 1) {
        const onlyChannel = declaredChannels[0];
        applyOverrides(onlyChannel, aliasSeries);
        store.set(`${alias}.${onlyChannel}`, aliasSeries);
      } else {
        throw new Error(
          `Engine: function for "${objName}" returned an unnamed series, but "${objNode.fnName}" declares multiple channels (${declaredChannels.join(', ')}). ` +
          `Return channel-named data from the function instead.`
        );
      }
    }

    // keep raw obj result if you want
    byAlias.set(alias, result);
  }

  // --------------------- 5) post-pass: build object-level channel totals ---------------------
  for (const [objName, outs] of index.outputsByObject.entries()) {
    const aliases = outs.filter(Boolean);
    if (aliases.length === 0) continue;

    const channelSums = new Map(); // channel -> Float64Array

    for (const alias of aliases) {
      const aliasKeys = [...store.keys()].filter(k => k.startsWith(`${alias}.`));
      for (const key of aliasKeys) {
        const arr = store.get(key);
        if (!(arr instanceof Float64Array)) continue;
        const [, channel] = key.split(".");
        if (!channel) continue;

        if (!channelSums.has(channel)) {
          channelSums.set(channel, new Float64Array(arr.length));
        }
        const sumArr = channelSums.get(channel);
        for (let m = 0; m < arr.length; m++) {
          sumArr[m] += arr[m];
        }
      }
    }

    for (const [channel, arr] of channelSums.entries()) {
      store.set(`${objName}.${channel}`, arr);
    }
  }

  return { store, byAlias, order: outGraph.order };
}