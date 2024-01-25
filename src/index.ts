const templateCache: Record<string, string> = {};

function parseTemplate(template: string) {

    function charCode(char: string) {
        if (char.length > 1) {
            const map: Record<number, boolean> = {};
            for (let i = 0; i < char.length; i++) {
                map[char.charCodeAt(i)] = true;
            }
            return map;
        }
        return char.charCodeAt(0);
    }

    const isWhitespace = charCode(" \t\r\n") as Record<number, boolean>;
    const OPEN_ANGLE = charCode("<");
    const CLOSE_ANGLE = charCode(">");
    const OPEN_BRACE = charCode("{");
    const CLOSE_BRACE = charCode("}");
    const SEMICOLON = charCode(";");
    const EQUAL = charCode("=");
    const BACKSLASH = charCode("\\");
    const QUOTE = charCode("'");

    let index = 0;
    let startIndex = 0;
    const length = template.length;
    const result = "__nostache__";
    let funcBody = `let ${result}='';\n`;

    function appendResult(endIndex = index, extra = "") {
        if (endIndex > startIndex || extra) {
            funcBody += `${result}+='${template.slice(startIndex, endIndex)}${extra}';\n`;
        }
    }

    function appendOutput() {
        if (index > startIndex) {
            funcBody += `${result}+=${template.slice(startIndex, index)};\n`;
        }
    }

    function appendLogic() {
        if (index > startIndex) {
            funcBody += `${template.slice(startIndex, index)}\n`;
        }
    }

    function escapeChar(c: number) {
        if (c === BACKSLASH) {
            appendResult(index, "\\\\");
            index++;
            startIndex = index;
            return true;
        } else if (c === QUOTE) {
            appendResult(index, "\\'");
            index++;
            startIndex = index;
            return true;
        }
        return false;
    }

    function parseOpenBlock(c: number) {
        if (c === OPEN_ANGLE && template.charCodeAt(index + 1) === OPEN_BRACE) {
            appendResult();
            index += 2;
            parseLogicBlock();
            return true;
        } else if (c === EQUAL && template.charCodeAt(index + 1) === OPEN_BRACE) {
            appendResult();
            index += 2;
            parseOutputBlock();
            return true;
        } else if (c === OPEN_ANGLE && template.charCodeAt(index + 1) === SEMICOLON && template.charCodeAt(index + 2) === CLOSE_ANGLE) {
            appendResult();
            index++;
            startIndex = index;
            index++;
            appendLogic();
            index++;
            startIndex = index;
            return true;
        } else if (escapeChar(c)) {
            return true;
        }
        return false;
    }

    function parseLogicBlock() {
        startIndex = index;
        let isPotentialHtml = true; // We can start html block right away
        for (; index < length;) {
            const c = template.charCodeAt(index);
            if (c === OPEN_BRACE) {
                index++;
                isPotentialHtml = true;
            } else if (isPotentialHtml && isWhitespace[c]) {
                index++;
            } else if (isPotentialHtml && c === OPEN_ANGLE) {
                isPotentialHtml = false;
                appendLogic();
                parseHtmlBlock();
            } else if (c === CLOSE_BRACE && template.charCodeAt(index + 1) === CLOSE_ANGLE) {
                appendLogic();
                index += 2;
                break;
            } else {
                index++;
                isPotentialHtml = false;
            }
        }
        startIndex = index;
    }

    function parseHtmlBlock() {
        startIndex = index;
        let potentialEnd = -1;
        for (; index < length;) {
            const c = template.charCodeAt(index);
            if (parseOpenBlock(c)) {
                // continue
            } else if (c === CLOSE_ANGLE) {
                index++;
                potentialEnd = index;
            } else if (potentialEnd >= 0 && isWhitespace[c]) {
                index++;
            } else if (potentialEnd && c === CLOSE_BRACE) {
                appendResult(potentialEnd);
                break;
            } else if (escapeChar(c)) {
                // continue
            } else {
                index++;
                potentialEnd = -1;
            }
        }
        startIndex = index;
    }

    function parseOutputBlock() {
        startIndex = index;
        let hasMeaningfulSymbol = false;
        for (; index < length;) {
            const c = template.charCodeAt(index);
            if (c === CLOSE_BRACE && template.charCodeAt(index + 1) === CLOSE_ANGLE) {
                if (hasMeaningfulSymbol) {
                    appendOutput();
                }
                index += 2;
                break;
            } else if (isWhitespace[c]) {
                index++;
            } else {
                index++;
                hasMeaningfulSymbol = true;
            }
        }
        startIndex = index;
    }

    for (; index < length;) {
        const c = template.charCodeAt(index);
        if (parseOpenBlock(c)) {
            // continue
        } else {
            index++;
        }
    }
    appendResult();
    funcBody += `return ${result};`;

    return funcBody;
}

export default function Nostache(template: string): (context?: unknown) => string {
    const funcBody = templateCache[template] ?? (templateCache[template] = parseTemplate(template));
    return (context?: unknown) => {
        const argNames = [];
        const argValues = [];
        const baseObject = {};
        if (context && typeof context === "object") {
            for (const p in context) {
                if (!(p in baseObject) && /^[_a-z]\w*$/i.test(p)) {
                    argNames.push(p);
                    argValues.push((context as any)[p]);
                }
            }
        }
        try {
            return Function(...argNames, funcBody).apply(context, argValues);
        } catch (error: any) {
            error.message += `\nat function (${argNames.join(", ")}) {\n${funcBody}\n}`;
            throw error;
        }
    };
}