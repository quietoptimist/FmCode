// @ts-nocheck
/**
 * Build an output-level dependency graph.
 * - Nodes are output aliases (strings).
 * - Keeps intra-object edges for debugging, but ignores them for topo order.
 */
// buildOutputGraph.mjs
export function buildOutputGraph(ast, index) {
  const aliasOwner = (alias) => index.aliases.get(alias)?.objectName ?? null;
  const objectAliases = index.outputsByObject;

  // 1) collect all aliases
  const allAliases = new Set();
  for (const [, outs] of objectAliases.entries()) {
    for (const a of outs) allAliases.add(a);
  }

  // 2) init deps
  const deps = new Map([...allAliases].map(a => [a, new Set()]));

  for (const node of ast.objects) {
    const consumerAliases =
      (node.outputs && node.outputs.length ? node.outputs : (objectAliases.get(node.name) || []))
        .filter(Boolean);

    if (consumerAliases.length === 0) continue;

    // collect producers per arg
    const inputsProducers = [];
    node.args.forEach((arg, argIndex) => {
      if (arg.kind !== 'ref') {
        inputsProducers[argIndex] = [];
        return;
      }
      const producers = [];
      if (index.aliases.has(arg.name)) {
        producers.push(arg.name);
      } else if (index.objectsByName.has(arg.name)) {
        const outs = objectAliases.get(arg.name) || [];
        for (const a of outs) producers.push(a);
      } else {
        // Unknown symbol - skip and it will be handled by the engine
        // throw new Error(`Output-graph: unknown symbol "${arg.name}"`);
      }
      inputsProducers[argIndex] = producers;
    });

    const outputCount = consumerAliases.length;
    const inputCount = inputsProducers.length;

    // only enforce when multiple outputs
    if (outputCount > 1 && inputCount > outputCount) {
      throw new Error(
        `Output-graph: object "${node.name}" has more inputs (${inputCount}) than outputs (${outputCount})`
      );
    }

    if (outputCount === 1) {
      // aggregate: all inputs feed the single output
      const cAlias = consumerAliases[0];
      const targetSet = deps.get(cAlias) || new Set();
      for (const producers of inputsProducers) {
        for (const pAlias of (producers || [])) {
          if (!allAliases.has(pAlias)) {
            allAliases.add(pAlias);
            deps.set(pAlias, new Set());
          }
          targetSet.add(pAlias);
        }
      }
      deps.set(cAlias, targetSet);
    } else {
      // positional
      for (let i = 0; i < outputCount; i++) {
        const cAlias = consumerAliases[i];
        const targetSet = deps.get(cAlias) || new Set();

        const producersForThisOutput =
          i < inputCount ? inputsProducers[i] : inputsProducers[inputCount - 1] || [];

        for (const pAlias of producersForThisOutput) {
          if (!allAliases.has(pAlias)) {
            allAliases.add(pAlias);
            deps.set(pAlias, new Set());
          }
          targetSet.add(pAlias);
        }
        deps.set(cAlias, targetSet);
      }
    }
  }

  // 3) adjacency for topo
  // 🟡 change: DO NOT skip intra-object edges anymore
  const adj = new Map([...allAliases].map(a => [a, new Set()]));
  for (const [cAlias, producers] of deps.entries()) {
    for (const pAlias of producers) {
      adj.get(pAlias).add(cAlias);
    }
  }

  // 4) topo sort
  const inDeg = new Map([...allAliases].map(a => [a, 0]));
  for (const [, kids] of adj.entries()) {
    for (const k of kids) inDeg.set(k, inDeg.get(k) + 1);
  }
  const queue = [...inDeg.entries()].filter(([, d]) => d === 0).map(([k]) => k);
  const order = [];
  while (queue.length) {
    const n = queue.shift();
    order.push(n);
    for (const child of adj.get(n)) {
      inDeg.set(child, inDeg.get(child) - 1);
      if (inDeg.get(child) === 0) queue.push(child);
    }
  }
  if (order.length !== allAliases.size) {
    const cycle = findAliasCycle(adj);
    const hint = cycle.length ? ` (cycle across outputs: ${cycle.join(' -> ')})` : '';
    throw new Error(`Dependency cycle detected at output level${hint}`);
  }

  // 5) dependents
  const dependents = new Map([...allAliases].map(a => [a, new Set()]));
  for (const [cAlias, producers] of deps.entries()) {
    for (const pAlias of producers) {
      dependents.get(pAlias).add(cAlias);
    }
  }

  return {
    nodes: [...allAliases],
    order,
    deps,
    dependents,
    aliasOwner,
    objectAliases,
  };
}

function findAliasCycle(adj) {
  const WHITE = 0, GREY = 1, BLACK = 2;
  const color = new Map([...adj.keys()].map(k => [k, WHITE]));
  const stack = [];
  function dfs(u) {
    color.set(u, GREY); stack.push(u);
    for (const v of adj.get(u)) {
      if (color.get(v) === GREY) {
        const i = stack.indexOf(v);
        return stack.slice(i).concat(v);
      }
      if (color.get(v) === WHITE) {
        const c = dfs(v); if (c) return c;
      }
    }
    stack.pop(); color.set(u, BLACK);
    return null;
  }
  for (const n of adj.keys()) {
    if (color.get(n) === WHITE) {
      const c = dfs(n); if (c) return c;
    }
  }
  return [];
}