import { fmCode } from './sourceFM.mjs';
import { parseAndLinkFM } from './parser.mjs';
import { buildOutputGraph } from './buildGraph.mjs';
import { objectSchema } from "./objectSchema.mjs";
import { buildModelAssumptions } from './buildModelAssumptions.mjs';
import { runEngine } from './engine.mjs';
import { fnRegistry } from './fnRegistry.mjs';
import { showObjectsWithRows } from './debugLogs.mjs'

// 1) Parse
const { ast, index } = parseAndLinkFM(fmCode);

// 2) Graph
const graph = buildOutputGraph(ast, index);

// 3) Assumptions (no assumptionTypes now)
const ctx = { months: 14, years: 2 };
const assumptions = buildModelAssumptions(ast, index, objectSchema, ctx);

// 4) Engine
const { store, byAlias, order } = runEngine({
  ast,
  index,
  outGraph: graph,
  assumptions,
  ctx,
  fnRegistry,
  objectSchema
});

console.log("Engine order (aliases):", order);
console.log("First few store keys:", [...store.keys()].slice(0, 40));

showObjectsWithRows(store, index, assumptions, objectSchema);