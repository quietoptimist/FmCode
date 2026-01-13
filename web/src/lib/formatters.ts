
export function formatName(name: string): string {
    if (!name) return name;
    // Insert space between lowercase and uppercase letters
    const words = name.replace(/([a-z])([A-Z])/g, '$1 $2');
    // Capitalize the first letter
    return words.charAt(0).toUpperCase() + words.slice(1);
}

export function reformatFmCode(input: string): string {
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
