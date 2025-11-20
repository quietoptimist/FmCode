/**
 * FM Parser (2-pass: parse → index → link)
 * Order-agnostic, supports spread args “…ObjectName.field”
 * and forward references to objects defined later in the file.
 */

/** =============================
 * Utilities
 * ============================== */
const sectionRe = /^\s*([A-Za-z][A-Za-z0-9_]*)\s*:\s*$/;
const objRe = /^\s*([A-Za-z][A-Za-z0-9_]*)\s*=\s*([A-Za-z][A-Za-z0-9_]*)\s*\((.*?)\)\s*(?:=>\s*(.*?))?\s*(?:\/\/(.*))?$/;

function splitCSV(s) {
  if (!s) return [];
  // args/outputs are simple comma lists (no nested parens/quotes in FM)
  return s.split(',').map(x => x.trim()).filter(Boolean);
}

function parseArg(token) {
  if (token.startsWith('...')) {
    const t = token.slice(3).trim();                  // e.g. AdviceWorkHrs.val
    const m = t.match(/^([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)$/);
    if (!m) throw new Error(`Invalid spread token: "${token}" (expected "...ObjectName.field")`);
    return { kind: 'spread', object: m[1], field: m[2], raw: token };
  }
  const ref = token.match(/^([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)$/);
  if (ref) return { kind: 'ref', name: ref[1], field: ref[2], raw: token };

  // simple numeric literal support
  if (/^[+-]?\d+(\.\d+)?$/.test(token)) {
    return { kind: 'literal', value: Number(token), raw: token };
  }
  // otherwise treat as identifier literal (engine/assumptions may interpret it)
  return { kind: 'literal', value: token, raw: token };
}

/** =============================
 * 1) Parse (structure only)
 * ============================== */
function parseFM(source) {
  const lines = source.split(/\r?\n/);
  const sections = [];
  const objects = []; // flat list
  let current = null;

  lines.forEach((raw, idx) => {
    const lineNo = idx + 1;
    const trimmed = raw.trim();

    if (!trimmed) return;
    if (trimmed.startsWith('//')) return;

    const s = trimmed.match(sectionRe);
    if (s) {
      current = { name: s[1], line: lineNo, objects: [] };
      sections.push(current);
      return;
    }

    const m = trimmed.match(objRe);
    if (m) {
      if (!current) {
        throw new Error(`Object found before any section (line ${lineNo}): "${trimmed}"`);
      }
      const [, objName, fnName, argStr, outStr, comment] = m;
      const args = splitCSV(argStr).map(parseArg);
      const outputs = splitCSV(outStr);
      const node = {
        id: `${current.name}.${objName}`,
        name: objName,
        fnName,
        args,           // unresolved (may include spreads)
        outputs,        // alias names (0..N)
        section: current.name,
        comment: comment?.trim(),
        line: lineNo
      };
      current.objects.push(node);
      objects.push(node);
      return;
    }

    // If you hit this, surface a helpful message:
    throw new Error(`Unrecognized line ${lineNo}: "${trimmed}"`);
  });

  return { sections, objects };
}

/** =============================
 * 2) Index (forward-ref friendly)
 * - objectsByName:  ObjectName → node
 * - aliases:        aliasName → { objectName, node }
 * - outputsByObject:ObjectName → [alias1, alias2, ...]
 * ============================== */
function buildIndex(ast) {
  const objectsByName = new Map();
  const aliases = new Map();
  const outputsByObject = new Map();

  for (const node of ast.objects) {
    if (objectsByName.has(node.name)) {
      const prev = objectsByName.get(node.name);
      throw new Error(`Duplicate object name "${node.name}" at line ${node.line} (already at line ${prev.line}).`);
    }
    objectsByName.set(node.name, node);

    // If no outputs declared, synthesize one using the object name
    const outs = node.outputs && node.outputs.length ? [...node.outputs] : [node.name];
    outputsByObject.set(node.name, outs);

    // Register aliases
    for (const alias of outs) {
      if (aliases.has(alias)) {
        const prev = aliases.get(alias);
        throw new Error(
          `Output alias "${alias}" from ${node.name} (line ${node.line}) conflicts with ${prev.objectName} (line ${prev.node.line}).`
        );
      }
      aliases.set(alias, { objectName: node.name, node, synthetic: !node.outputs || node.outputs.length === 0 });
    }
  }

  return { objectsByName, aliases, outputsByObject };
}

/** =============================
 * 3) Link (expand spreads + validate refs)
 * - Replace each spread with a list of concrete refs to that
 *   object's output aliases, all pointing to the requested field.
 * - Allow forward references (index already knows every object).
 * ============================== */
function linkFM(ast, index) {
  const { objectsByName, aliases, outputsByObject } = index;

  // Helper: does a base name exist as object or alias?
  function hasSymbol(base) {
    return objectsByName.has(base) || aliases.has(base);
  }

  const linkedObjects = ast.objects.map(node => {
    const linkedArgs = [];
    for (const arg of node.args) {
      if (arg.kind === 'spread') {
        const objName = arg.object;
        if (!objectsByName.has(objName)) {
          throw new Error(
            `Spread references unknown object "${objName}" at line ${node.line} in ${node.name}. ` +
            `Ensure the object exists (forward refs ARE supported).`
          );
        }
        const outs = outputsByObject.get(objName) || [];
        if (outs.length === 0) {
          throw new Error(
            `Spread on "${objName}.${arg.field}" at line ${node.line} but "${objName}" declares no outputs to spread.`
          );
        }
        // Expand to alias.field for each declared output alias
        for (const alias of outs) {
          linkedArgs.push({ kind: 'ref', name: alias, field: arg.field, fromSpreadOf: objName });
        }
      } else if (arg.kind === 'ref') {
        if (!hasSymbol(arg.name)) {
          throw new Error(
            `Unknown reference "${arg.name}.${arg.field}" at line ${node.line} in ${node.name}. ` +
            `It must be an ObjectName or an output alias.`
          );
        }
        linkedArgs.push(arg);
      } else {
        linkedArgs.push(arg); // literals pass through
      }
    }
    // return a shallow copy with resolved args
    return { ...node, args: linkedArgs };
  });

  // Return a linked AST (sections carry linked objects too)
  const sections = ast.sections.map(sec => ({
    ...sec,
    objects: linkedObjects.filter(n => n.section === sec.name)
  }));

  return { sections, objects: linkedObjects };
}

/** =============================
 * Public entry—convenience wrapper
 * ============================== */
export function parseAndLinkFM(source) {
  const ast = parseFM(source);
  const index = buildIndex(ast);
  const linked = linkFM(ast, index);
  return { ast: linked, index };
}

