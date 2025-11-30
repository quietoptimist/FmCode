// @ts-nocheck
/**
 * FM Parser (2-pass: parse → index → link)
 * Order-agnostic, supports spread args “…ObjectName.field”
 * and forward references to objects defined later in the file.
 * 
 * UPDATED: Supports metadata headers, multi-line objects, and assumption values.
 */

/** =============================
 * Utilities
 * ============================== */
const sectionRe = /^\s*([A-Za-z][A-Za-z0-9_]*)\s*:\s*$/;
// Regex for object definition. 
// Note: We will run this on "normalized" single lines.
// Captures: 1=ObjName, 2=FnName, 3=Args, 4=Outputs(optional), 5=Comment(optional)
const objRe = /^\s*([A-Za-z][A-Za-z0-9_]*)\s*=\s*([A-Za-z][A-Za-z0-9_]*)\s*\((.*?)\)\s*(?:(?:=>|>)\s*(.*?))?\s*(?:\/\/(.*))?$/;

// Helper to split by comma but respect parentheses (for assumption args)
function splitRespectingParens(s) {
  if (!s) return [];
  const parts = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;

    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
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

function parseAssumptions(argsStr) {
  if (!argsStr) return {};
  const assumptions = {};
  const parts = argsStr.split(',').map(p => p.trim());

  parts.forEach(part => {
    const [key, val] = part.split(':').map(s => s.trim());
    if (key && val) {
      // Try to parse number, percent, or string
      if (val.endsWith('%')) {
        assumptions[key] = parseFloat(val) / 100;
      } else if (!isNaN(parseFloat(val))) {
        assumptions[key] = parseFloat(val);
      } else {
        // Remove quotes if present
        assumptions[key] = val.replace(/^["']|["']$/g, '');
      }
    }
  });
  return assumptions;
}

function parseOutputs(outStr) {
  if (!outStr) return [];
  const rawOutputs = splitRespectingParens(outStr);

  return rawOutputs.map(raw => {
    // Check for Alias(args...)
    const m = raw.match(/^([A-Za-z0-9_]+)\s*(?:\((.*)\))?$/);
    if (m) {
      const name = m[1];
      const argsStr = m[2];
      const assumptions = argsStr ? parseAssumptions(argsStr) : {};
      return { name, assumptions };
    }
    return { name: raw, assumptions: {} };
  });
}

/** =============================
 * 1) Parse (structure only)
 * ============================== */
function parseFM(source) {
  const lines = source.split(/\r?\n/);
  const sections = [];
  const objects = []; // flat list
  const metadata = {};

  let currentSection = null;
  let pendingComments = [];

  // Pre-process: Normalize lines (handle multi-line objects)
  const normalizedLines = [];
  let buffer = '';
  let bufferStartLine = 0;

  // Metadata scanning state
  let scanningMetadata = true;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    const originalLine = lines[i]; // Keep original for indentation check if needed

    if (!line) {
      // Blank line
      if (buffer) {
        // Flush buffer if we were building an object
        normalizedLines.push({ text: buffer, line: bufferStartLine });
        buffer = '';
      }
      pendingComments = []; // Clear pending comments on blank lines
      continue;
    }

    // Metadata extraction (only at top of file)
    if (scanningMetadata) {
      if (line.startsWith('//')) {
        const metaMatch = line.match(/^\/\/\s*([A-Za-z0-9_]+)\s*:\s*(.*)$/);
        if (metaMatch) {
          metadata[metaMatch[1]] = metaMatch[2].trim();
          continue; // Consumed as metadata
        }
        // If it's a comment but not key:value, it might be a normal comment. 
        // But usually metadata block is contiguous. We'll treat it as a comment.
      } else {
        // First non-comment line stops metadata scanning
        scanningMetadata = false;
      }
    }

    // Section Header
    if (line.match(sectionRe)) {
      if (buffer) {
        normalizedLines.push({ text: buffer, line: bufferStartLine });
        buffer = '';
      }
      normalizedLines.push({ text: line, line: i + 1, isSection: true });
      pendingComments = []; // Clear comments before section
      continue;
    }

    // Comment handling
    if (line.startsWith('//')) {
      pendingComments.push(line.substring(2).trim());
      continue;
    }

    // Object Definition (potentially multi-line)
    // Check if this line continues the previous one
    // Continuation if: buffer exists AND (buffer ends with continuation char OR current line starts with continuation logic?)
    // Actually user said: "when the following line continues... vs starting new object"
    // Simple heuristic: If buffer exists, append.
    // Wait, we need to know when an object ENDS.
    // Heuristic: If a line contains '=', it starts a new object (unless it's inside parens? No, FM syntax is simple).
    // So if we have a buffer, and the NEW line starts with "Name =", flush the buffer.

    const isNewObject = line.match(/^\s*[A-Za-z][A-Za-z0-9_]*\s*=/);

    if (isNewObject) {
      if (buffer) {
        normalizedLines.push({ text: buffer, line: bufferStartLine });
      }
      buffer = line;
      bufferStartLine = i + 1;
    } else {
      // Continuation line
      if (buffer) {
        // Strip trailing comments from the PREVIOUS buffer content if we are appending?
        // User said: "stripping them from the end of a line when the comment follows a continuation character"
        // Actually, simpler: Strip trailing comment from THIS line before appending.
        const commentIdx = line.indexOf('//');
        let content = line;
        if (commentIdx !== -1) {
          content = line.substring(0, commentIdx).trim();
        }
        buffer += ' ' + content;
      } else {
        // Orphan line? Or maybe a syntax error. 
        // Or maybe the file started with a continuation (invalid).
        // We'll treat it as a line to process, maybe it throws later.
        normalizedLines.push({ text: line, line: i + 1 });
      }
    }
  }

  if (buffer) {
    normalizedLines.push({ text: buffer, line: bufferStartLine });
  }

  // Now parse the normalized lines
  // Reset pending comments as we might have consumed them during normalization? 
  // Actually, the pendingComments logic above was slightly flawed because we were iterating lines.
  // Let's redo the loop structure slightly to handle comments correctly with the normalization.

  // RESTARTING LOOP LOGIC FOR CLEANER IMPLEMENTATION
  // We need to associate comments with the *next* object.

  // Let's clear arrays and do it in one pass if possible, or stick to the normalization plan.
  // The normalization plan is safer. Let's refine the normalization loop above.

  // Actually, let's just parse the normalizedLines array now.
  // But we lost the "pendingComments" association.
  // Let's store comments in the normalizedLines structure.

  // RE-RE-THINK:
  // We can't easily normalize without knowing if a line is a comment or code.
  // Let's do a single pass state machine.

  const finalSections = [];
  const finalObjects = [];
  currentSection = null;
  let currentComments = [];

  // Comments belonging to the object currently being buffered
  let bufferComments = [];

  // Re-scan lines for the actual parsing pass
  // We need to handle the "buffer" logic dynamically.

  buffer = '';
  bufferStartLine = 0;

  // Reset metadata scanning
  scanningMetadata = true;
  const finalMetadata = {};

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    const lineNo = i + 1;

    if (!line) {
      if (buffer) {
        processBuffer(buffer, bufferStartLine, bufferComments);
        buffer = '';
        bufferComments = []; // Comments consumed
      }
      currentComments = []; // Abandon comments on blank lines (orphaned)
      continue;
    }

    // Metadata extraction (only at top of file)
    if (scanningMetadata) {
      if (line === 'FM') continue; // Ignore FM header
      if (line.startsWith('//')) {
        const metaMatch = line.match(/^\/\/\s*([A-Za-z0-9_]+)\s*:\s*(.*)$/);
        if (metaMatch) {
          finalMetadata[metaMatch[1]] = metaMatch[2].trim();
          continue;
        }
        // Fallthrough to normal comment handling if not key:value
      } else {
        // First non-comment line (that isn't FM) stops metadata scanning
        scanningMetadata = false;
      }
    }

    // Section
    if (line.match(sectionRe)) {
      if (buffer) {
        processBuffer(buffer, bufferStartLine, bufferComments);
        buffer = '';
        bufferComments = [];
      }
      const s = line.match(sectionRe);
      currentSection = { name: s[1], line: lineNo, objects: [] };
      finalSections.push(currentSection);
      currentComments = [];
      continue;
    }

    // Comment (standalone line)
    if (line.startsWith('//')) {
      currentComments.push(line.substring(2).trim());
      continue;
    }

    // Object Start
    if (line.match(/^\s*[A-Za-z][A-Za-z0-9_]*\s*=/)) {
      if (buffer) {
        processBuffer(buffer, bufferStartLine, bufferComments);
        buffer = '';
        bufferComments = [];
      }

      // Start new buffer
      // Transfer preceding comments to this new object
      bufferComments = [...currentComments];
      currentComments = [];

      bufferStartLine = lineNo;

      // Check for trailing comment on this start line
      const commentIdx = line.indexOf('//');
      if (commentIdx !== -1) {
        bufferComments.push(line.substring(commentIdx + 2).trim());
        buffer = line.substring(0, commentIdx).trim();
      } else {
        buffer = line;
      }
    } else {
      // Continuation
      if (buffer) {
        // Strip trailing comment from continuation line
        const commentIdx = line.indexOf('//');
        let content = line;
        if (commentIdx !== -1) {
          content = line.substring(0, commentIdx).trim();
          // Capture the comment!
          bufferComments.push(line.substring(commentIdx + 2).trim());
        }
        buffer += ' ' + content;
      } else {
        // Syntax error or stray line
        // throw new Error(`Unexpected line ${lineNo}: "${line}"`);
      }
    }
  }

  // Flush final buffer
  if (buffer) {
    processBuffer(buffer, bufferStartLine, bufferComments);
  }

  function processBuffer(text, lineNo, comments) {
    const m = text.match(objRe);
    if (m) {
      if (!currentSection) {
        throw new Error(`Object found before any section (line ${lineNo}): "${text}"`);
      }
      const [, objName, fnName, argStr, outStr, trailingComment] = m;

      const args = splitCSV(argStr).map(parseArg);
      const parsedOutputs = parseOutputs(outStr);
      const outputNames = parsedOutputs.map(o => o.name);

      // Merge comments: Preceding + Trailing
      let finalComment = comments.join('\n');
      if (trailingComment) {
        finalComment = finalComment ? finalComment + '\n' + trailingComment.trim() : trailingComment.trim();
      }

      const node = {
        id: `${currentSection.name}.${objName}`,
        name: objName,
        fnName,
        args,
        outputs: outputNames,
        outputAssumptions: parsedOutputs, // Store full structure
        section: currentSection.name,
        comment: finalComment,
        line: lineNo,
        metadata: finalMetadata // Attach global metadata to every object? Or just return it separately?
        // The request said "capture that information and display it at the top of the model page".
        // Usually the parser returns { sections, objects, metadata }.
      };
      currentSection.objects.push(node);
      finalObjects.push(node);
    }
  }

  return { sections: finalSections, objects: finalObjects, metadata: finalMetadata };
}

function splitCSV(s) {
  if (!s) return [];
  // args are simple comma lists (no nested parens/quotes in FM args usually, unless spread)
  return s.split(',').map(x => x.trim()).filter(Boolean);
}

/** =============================
 * 2) Index (forward-ref friendly)
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
 * ============================== */
function linkFM(ast, index) {
  const { objectsByName, aliases, outputsByObject } = index;

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
    return { ...node, args: linkedArgs };
  });

  const sections = ast.sections.map(sec => ({
    ...sec,
    objects: linkedObjects.filter(n => n.section === sec.name)
  }));

  return { sections, objects: linkedObjects, metadata: ast.metadata };
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
