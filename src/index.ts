const templateCache: Record<string, string> = {};

// todo test for js in html
// todo test for loops
// todo allow ={ ~{ in code blocks, implement check for string literals
// todo implement expressions like <{if (true) {>true<} else {>false<}> as alternative to <{if (true) }>true<{ else }>false<{}>
// todo think about simplified expressions like <a class={"class"}>{"text"}</a>
// todo errors for unfinished expressions
// todo table of control characters in readme.md
const parseTemplate = (template: string) => {

    const charCode = (char: string) => {
        if (char.length > 1) {
            const map: Record<number, boolean> = {};
            for (let i = 0; i < char.length; i++) {
                map[char.charCodeAt(i)] = true;
            }
            return map;
        }
        return char.charCodeAt(0);
    };

    const isWhitespace = charCode(" \t\r\n") as Record<number, boolean>;
    const OPEN_ANGLE = charCode("<");
    const CLOSE_ANGLE = charCode(">");
    const OPEN_BRACE = charCode("{");
    const CLOSE_BRACE = charCode("}");
    const ASSIGN = charCode("=");
    const TILDE = charCode("~");
    const BACKSLASH = charCode("\\");
    const APOSTROPHE = charCode("'");
    const QUOTE = charCode("\"");
    const BACKTICK = charCode("`");
    const DOLLAR = charCode("$");

    let index = 0;
    let startIndex = 0;
    const length = template.length;
    let funcBody = "";

    const appendResult = (endIndex = index, extra = "") => {
        if (endIndex > startIndex || extra) {
            funcBody += `yield \`${template.slice(startIndex, endIndex)}${extra}\`;\n`;
        }
    };

    const appendOutput = (unsafe: boolean) => {
        if (index > startIndex) {
            funcBody += unsafe ?
                `yield ${template.slice(startIndex, index)};\n` :
                `yield this.escape(${template.slice(startIndex, index)});\n`;
        }
    };

    const appendLogic = () => {
        if (index > startIndex) {
            funcBody += `${template.slice(startIndex, index)}`;
        }
    };

    const parseOpenBlock = (c: number) => {
        if (c === OPEN_ANGLE && template.charCodeAt(index + 1) === OPEN_BRACE) {
            // Logic block <{
            appendResult();
            index += 2;
            parseLogicBlock();
            return true;
        } else if (c === OPEN_BRACE && template.charCodeAt(index + 1) === ASSIGN) {
            // Assignment block ={
            appendResult();
            index += 2;
            parseOutputBlock(false);
            return true;
        } else if (c === OPEN_BRACE && template.charCodeAt(index + 1) === TILDE) {
            // Unsafe assignment block ~{
            appendResult();
            index += 2;
            parseOutputBlock(true);
            return true;
        } else if (c === BACKSLASH) {
            // Escape backslash \
            appendResult(index, "\\\\");
            index++;
            startIndex = index;
            return true;
        } else if (c === BACKTICK) {
            // Escape backtick
            appendResult(index, "\\`");
            index++;
            startIndex = index;
            return true;
        } else if (c === DOLLAR) {
            // Escape dollar
            appendResult(index, "\\$");
            index++;
            startIndex = index;
            return true;
        }
        return false;
    };

    const parseLogicBlock = () => {
        startIndex = index;
        let isInString = 0;
        let isPotentialHtml = true; // We can start html block right away
        for (; index < length;) {
            const c = template.charCodeAt(index);
            if (!isInString && (c === APOSTROPHE || c === QUOTE || c === BACKTICK)) {
                isInString = c;
                index++;
                isPotentialHtml = false;
            } else if (isInString && c === BACKSLASH) {
                index += 2;
            } else if (isInString && c === isInString) {
                isInString = 0;
                index++;
            } else if (!isInString && c === OPEN_BRACE) {
                index++;
                isPotentialHtml = true;
            } else if (isPotentialHtml && isWhitespace[c]) {
                index++;
            } else if (isPotentialHtml && c === OPEN_ANGLE) {
                isPotentialHtml = false;
                appendLogic();
                parseHtmlBlock();
            } else if (!isInString && c === CLOSE_BRACE && template.charCodeAt(index + 1) === CLOSE_ANGLE) {
                appendLogic();
                index += 2;
                break;
            } else {
                index++;
                isPotentialHtml = false;
            }
        }
        startIndex = index;
    };

    const parseHtmlBlock = () => {
        startIndex = index;
        let potentialEnd = -1;
        for (; index < length;) {
            const c = template.charCodeAt(index);
            if (c === CLOSE_ANGLE) {
                index++;
                potentialEnd = index;
            } else if (potentialEnd >= 0 && isWhitespace[c]) {
                index++;
            } else if (potentialEnd >= 0 && c === CLOSE_BRACE) {
                appendResult(potentialEnd);
                break;
            } else if (parseOpenBlock(c)) {
                // continue
            } else {
                index++;
                potentialEnd = -1;
            }
        }
        startIndex = index;
    };

    const parseOutputBlock = (unsafe: boolean) => {
        startIndex = index;
        const closeChar = unsafe ? TILDE : ASSIGN;
        let hasMeaningfulSymbol = false;
        let isInString = 0;
        for (; index < length;) {
            const c = template.charCodeAt(index);
            if (!isInString && (c === APOSTROPHE || c === QUOTE || c === BACKTICK)) {
                isInString = c;
                index++;
                hasMeaningfulSymbol = true;
            } else if (isInString && c === BACKSLASH) {
                index += 2;
            } else if (isInString && c === isInString) {
                isInString = 0;
                index++;
            } else if (!isInString && c === closeChar && template.charCodeAt(index + 1) === CLOSE_BRACE) {
                if (hasMeaningfulSymbol) {
                    appendOutput(unsafe);
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
    };

    for (; index < length;) {
        const c = template.charCodeAt(index);
        if (parseOpenBlock(c)) {
            // continue
        } else {
            index++;
        }
    }
    appendResult();
    return `return(async function*(){\n${funcBody}}).call(this)`;
}

const escape = async (value: unknown) => {
    return String(await value).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
};

const Nostache = (template: string): ((...context: unknown[]) => Promise<string>) & {
    verbose: boolean,
    toString(): string,
    escape(value: unknown): Promise<string>,
} => {
    const funcBody = templateCache[template] ?? (templateCache[template] = parseTemplate(template));
    const templateFunc = async (...context: unknown[]) => {
        const argNames = [];
        const argValues = [];
        for (const c of context) {
            if (c && typeof c === "object" && !Array.isArray(c)) {
                for (const p in c) {
                    if (/^[_a-z]\w*$/i.test(p)) {
                        argNames.push(p);
                        argValues.push((c as any)[p]);
                    }
                }
            }
        }
        try {
            if (templateFunc.verbose) {
                console.groupCollapsed(`(function Nostache(${argNames.join(", ")}) {`);
                console.log(`${funcBody}})\n(`, ...argValues.reduce((a, t) => {
                    if (a.length > 0) a.push(",");
                    a.push(typeof t === "string" ? `"${t}"` : t);
                    return a;
                }, []), ")")
                console.groupEnd();
            }
            const contextFunc = (...context: unknown[]) => {
                return templateFunc(...context);
            };
            for (let i = 0; i < context.length; i++) {
                (contextFunc as any)[i] = context[i];
            }
            contextFunc.escape = templateFunc.escape;
            const asyncGenerator: AsyncGenerator<string> = Function(...argNames, funcBody).apply(contextFunc, argValues);
            let result = "";
            while (true) {
                const chunk = await asyncGenerator.next();
                if (chunk.done) {
                    break;
                } else {
                    result += chunk.value;
                }
            }
            return result;
        } catch (error: any) {
            error.message += `\nat function (${argNames.join(", ")}) {\n${funcBody}\n})(${
                argValues.map(t => typeof t === "string" ? `"${t}"` : t).join(", ")
            })`;
            throw error;
        }
    };
    templateFunc.verbose = Nostache.verbose;
    templateFunc.toString = () => funcBody;
    templateFunc.escape = escape;
    return templateFunc;
};

Nostache.verbose = false;

export default Nostache;