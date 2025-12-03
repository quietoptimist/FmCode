
export function formatName(name: string): string {
    if (!name) return name;
    // Insert space between lowercase and uppercase letters
    const words = name.replace(/([a-z])([A-Z])/g, '$1 $2');
    // Capitalize the first letter
    return words.charAt(0).toUpperCase() + words.slice(1);
}

export function reformatFmCode(input: string, keepAssumptions: boolean = true): string {
    const lines = input.split('\n');
    const output: string[] = [];
    let pendingComments: string[] = [];
    let currentObjectCode = '';
    let currentObjectComments: string[] = [];
    let isBuildingObject = false;

    // Helper to flush current object
    const flushObject = () => {
        if (currentObjectCode) {
            let line = currentObjectCode.trimEnd(); // Keep leading indentation

            // Strip assumptions if requested
            if (!keepAssumptions) {
                // Replace (key: value, ...) with empty string
                // We need to be careful not to match function calls like ObjectType(...) 
                // But wait, ObjectType(...) IS the definition.
                // The user said: "strip out any brackets (and values inside) used to define output assumptions"
                // e.g. outputName(assumName: assumValue) becomes outputName
                // The Object definition is MyObject = ObjectType(...) > outputName(...)
                // So we only want to strip brackets on the RHS of the >
                // Or maybe just strip all brackets that look like assumptions?
                // Assumptions usually have key:value pairs.
                // ObjectType(...) usually has arguments which might be ref.val.

                // Let's look at the structure:
                // MyObject = ObjectType(args) > output1(assum: val), output2

                // If we blindly strip (...), we might strip ObjectType(args).
                // We should only strip after the > character if present?
                // Or maybe we can rely on the fact that assumption brackets contain : ?
                // ObjectType args usually don't contain : unless it's a named arg?
                // FM code spec says inputs are just outputName.attr.

                // Safer approach: Split by >. The LHS is definition, RHS is outputs.
                // Only strip brackets in RHS.

                const parts = line.split('>');
                if (parts.length > 1) {
                    // Has outputs
                    const lhs = parts[0];
                    let rhs = parts.slice(1).join('>'); // In case > appears elsewhere (unlikely but safe)

                    // Strip (...) from rhs
                    rhs = rhs.replace(/\([^)]*\)/g, '');

                    line = lhs + '>' + rhs;
                }
            }

            // Append comments
            const allComments = [...pendingComments, ...currentObjectComments];
            if (allComments.length > 0) {
                line += ' // ' + allComments.join('; ');
            }
            output.push(line);
        }
        currentObjectCode = '';
        currentObjectComments = [];
        pendingComments = [];
        isBuildingObject = false;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) {
            continue;
        }

        // Extract comment from line
        // Be careful not to match // inside strings if FM code supports strings (it usually doesn't have quoted strings with // inside)
        const commentMatch = line.match(/\/\/(.*)$/);
        let codePart = line;
        let commentPart = '';
        if (commentMatch) {
            commentPart = commentMatch[1].trim();
            codePart = line.substring(0, commentMatch.index).trimEnd();
        }

        // If line is ONLY comment
        if (!codePart.trim()) {
            if (isBuildingObject) {
                currentObjectComments.push(commentPart);
            } else {
                pendingComments.push(commentPart);
            }
            continue;
        }

        // Check if it is a Section Title (ends with :)
        // FM code section titles: "Name:"
        if (codePart.trim().endsWith(':') && !codePart.includes('=')) {
            // Flush any previous object
            if (isBuildingObject) flushObject();

            // Add blank line before section if not first
            if (output.length > 0) {
                output.push('');
            }

            // Output the section title
            let outLine = codePart;
            if (commentPart) {
                outLine += ' // ' + commentPart;
            }
            // If there were pending comments, output them before section
            if (pendingComments.length > 0) {
                pendingComments.forEach(c => output.push('// ' + c));
                pendingComments = [];
            }
            output.push(outLine);
            continue;
        }

        // It is code (Object definition or part of it)
        if (!isBuildingObject) {
            // Start of new object
            isBuildingObject = true;
            // Preserve indentation of the first line
            currentObjectCode = codePart;

            if (commentPart) currentObjectComments.push(commentPart);
        } else {
            // Continuation
            // Append to currentObjectCode with a space
            currentObjectCode += ' ' + codePart.trim();
            if (commentPart) currentObjectComments.push(commentPart);
        }

        // Check if object is finished
        // Ends with > or , means continuation
        const trimmedCode = currentObjectCode.trim();
        if (trimmedCode.endsWith('>') || trimmedCode.endsWith(',')) {
            // Continues
        } else {
            // Finished
            flushObject();
        }
    }

    if (isBuildingObject) flushObject();

    return output.join('\n');
}
