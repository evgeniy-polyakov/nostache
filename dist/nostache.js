(function(g,f){typeof exports==='object'&&typeof module!=='undefined'?module.exports=f():typeof define==='function'&&define.amd?define(f):(g=typeof globalThis!=='undefined'?globalThis:g||self,g.Nostache=f());})(this,(function(){'use strict';const templateCache = {};
// todo errors for unfinished expressions
// todo extension functions
// todo support of older browsers
// todo expressions like <{ const f = <(i){ <div>Inner Template {=i=}<div/> }> }> for inner templates in JS strings
// todo expressions like <(a,b,c)> for template arguments (no whitespace at the end)
// todo remove explicit object decomposition - this would allow to store the compiled template function instead of a string
// todo don't allow whitespace between control characters in text and output blocks {> <} {= =} {~ ~}
// todo layout/block/region technics
// todo table of control characters in readme.md
// todo ; before yield in some cases
const parseTemplate = (template) => {
    const charCode = (char) => {
        if (char.length > 1) {
            const map = {};
            for (let i = 0; i < char.length; i++) {
                map[char.charCodeAt(i)] = true;
            }
            return map;
        }
        return char.charCodeAt(0);
    };
    const isWhitespace = charCode(" \t\r\n");
    const OPEN_ANGLE = charCode("<");
    const CLOSE_ANGLE = charCode(">");
    const OPEN_BRACE = charCode("{");
    const CLOSE_BRACE = charCode("}");
    const ASSIGN = charCode("=");
    const TILDE = charCode("~");
    const SLASH = charCode("/");
    const ASTERISK = charCode("*");
    const NEWLINE = charCode("\n");
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
    const appendOutput = (unsafe) => {
        if (index > startIndex) {
            funcBody += unsafe ?
                `yield (${template.slice(startIndex, index)});\n` :
                `yield this.escape(${template.slice(startIndex, index)});\n`;
        }
    };
    const appendLogic = () => {
        if (index > startIndex) {
            funcBody += `${template.slice(startIndex, index)}`;
        }
    };
    const parseOpenBlock = (c) => {
        if (c === OPEN_ANGLE && template.charCodeAt(index + 1) === OPEN_BRACE) {
            // Logic block <{
            appendResult();
            index += 2;
            parseLogicBlock();
            return true;
        }
        else if (c === OPEN_BRACE && template.charCodeAt(index + 1) === ASSIGN) {
            // Assignment block ={
            appendResult();
            index += 2;
            parseOutputBlock(false);
            return true;
        }
        else if (c === OPEN_BRACE && template.charCodeAt(index + 1) === TILDE) {
            // Unsafe assignment block ~{
            appendResult();
            index += 2;
            parseOutputBlock(true);
            return true;
        }
        else if (c === BACKSLASH) {
            // Escape backslash \
            appendResult(index, "\\\\");
            index++;
            startIndex = index;
            return true;
        }
        else if (c === BACKTICK) {
            // Escape backtick
            appendResult(index, "\\`");
            index++;
            startIndex = index;
            return true;
        }
        else if (c === DOLLAR) {
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
        let isPotentialText = true; // We can start html block right away
        for (; index < length;) {
            if (parseStringOrComment()) {
                isPotentialText = false;
                continue;
            }
            const c = template.charCodeAt(index);
            if (c === OPEN_BRACE) {
                index++;
                isPotentialText = true;
            }
            else if (isPotentialText && isWhitespace[c]) {
                index++;
            }
            else if (isPotentialText && c === OPEN_ANGLE) {
                isPotentialText = false;
                appendLogic();
                parseHtmlBlock();
            }
            else if (isPotentialText && c === CLOSE_ANGLE) {
                isPotentialText = false;
                appendLogic();
                index++;
                parseTextBlock();
            }
            else if (isPotentialText && (c === ASSIGN || c === TILDE)) {
                isPotentialText = false;
                appendLogic();
                index++;
                parseOutputBlock(c === TILDE);
                startIndex--;
            }
            else if (c === CLOSE_BRACE && template.charCodeAt(index + 1) === CLOSE_ANGLE) {
                appendLogic();
                index += 2;
                break;
            }
            else {
                index++;
                isPotentialText = false;
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
            }
            else if (potentialEnd >= 0 && isWhitespace[c]) {
                index++;
            }
            else if (potentialEnd >= 0 && c === CLOSE_BRACE) {
                appendResult(potentialEnd);
                break;
            }
            else if (parseOpenBlock(c)) ;
            else {
                index++;
                potentialEnd = -1;
            }
        }
        startIndex = index;
    };
    const parseTextBlock = () => {
        startIndex = index;
        let potentialEnd = -1;
        let potentialEndWhitespace = -1;
        let hasMeaningfulSymbol = false;
        for (; index < length;) {
            const c = template.charCodeAt(index);
            if (!hasMeaningfulSymbol && isWhitespace[c]) {
                startIndex++;
                index++;
            }
            else if (hasMeaningfulSymbol && (c === OPEN_ANGLE || isWhitespace[c])) {
                if (potentialEndWhitespace < 0)
                    potentialEndWhitespace = index;
                if (c === OPEN_ANGLE)
                    potentialEnd = index;
                index++;
            }
            else if (potentialEnd >= 0 && isWhitespace[c]) {
                index++;
            }
            else if (potentialEnd >= 0 && c === CLOSE_BRACE) {
                appendResult(potentialEndWhitespace);
                break;
            }
            else if (parseOpenBlock(c)) {
                hasMeaningfulSymbol = true;
            }
            else {
                index++;
                potentialEnd = -1;
                potentialEndWhitespace = -1;
                hasMeaningfulSymbol = true;
            }
        }
        startIndex = index;
    };
    const parseOutputBlock = (unsafe) => {
        startIndex = index;
        const closeChar = unsafe ? TILDE : ASSIGN;
        let hasMeaningfulSymbol = false;
        for (; index < length;) {
            if (parseStringOrComment()) {
                hasMeaningfulSymbol = true;
                continue;
            }
            const c = template.charCodeAt(index);
            if (!hasMeaningfulSymbol && isWhitespace[c]) {
                index++;
            }
            else if (c === closeChar && template.charCodeAt(index + 1) === CLOSE_BRACE) {
                if (hasMeaningfulSymbol) {
                    appendOutput(unsafe);
                }
                index += 2;
                break;
            }
            else {
                index++;
                hasMeaningfulSymbol = true;
            }
        }
        startIndex = index;
    };
    const parseStringOrComment = () => {
        let isInString = 0;
        let isInComment = 0;
        let result = false;
        for (; index < length;) {
            const c = template.charCodeAt(index);
            let n = 0;
            if (!isInString && !isInComment && (c === APOSTROPHE || c === QUOTE || c === BACKTICK)) {
                isInString = c;
                index++;
                result = true;
            }
            else if (isInString && c === BACKSLASH) {
                index += 2;
            }
            else if (isInString && c === isInString) {
                isInString = 0;
                index++;
                return true;
            }
            else if (!isInString && !isInComment && c === SLASH && ((n = template.charCodeAt(index + 1)) === SLASH || n === ASTERISK)) {
                isInComment = n;
                index += 2;
                result = true;
            }
            else if (isInComment === SLASH && c === NEWLINE) {
                isInComment = 0;
                index++;
            }
            else if (isInComment === ASTERISK && c === ASTERISK && template.charCodeAt(index + 1) === SLASH) {
                isInComment = 0;
                index += 2;
                return true;
            }
            else if (isInComment || isInString) {
                index++;
            }
            else {
                return false;
            }
        }
        return result;
    };
    for (; index < length;) {
        const c = template.charCodeAt(index);
        if (parseOpenBlock(c)) ;
        else {
            index++;
        }
    }
    appendResult();
    return `return(async function*(){\n${funcBody}}).call(this)`;
};
const escape = async (value) => {
    return String(await value).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
};
const iterateGenerator = async (generator) => {
    let result = '';
    while (true) {
        const chunk = await generator.next();
        if (chunk.done) {
            break;
        }
        else {
            if (typeof chunk.value?.next === "function") {
                result += await iterateGenerator(chunk.value);
            }
            else {
                result += await chunk.value;
            }
        }
    }
    return result;
};
const Nostache = (template) => {
    const funcBody = templateCache[template] ?? (templateCache[template] = parseTemplate(template));
    const templateFunc = async (...context) => {
        const argNames = [];
        const argValues = [];
        for (const c of context) {
            if (c && typeof c === "object" && !Array.isArray(c)) {
                for (const p in c) {
                    if (/^[_a-z]\w*$/i.test(p)) {
                        argNames.push(p);
                        argValues.push(c[p]);
                    }
                }
            }
        }
        try {
            if (templateFunc.verbose) {
                console.groupCollapsed(`(function Nostache(${argNames.join(", ")}) {`);
                console.log(`${funcBody}})\n(`, ...argValues.reduce((a, t) => {
                    if (a.length > 0)
                        a.push(",");
                    a.push(typeof t === "string" ? `"${t}"` : t);
                    return a;
                }, []), ")");
                console.groupEnd();
            }
            const contextFunc = (...context) => {
                return templateFunc(...context);
            };
            for (let i = 0; i < context.length; i++) {
                contextFunc[i] = context[i];
            }
            contextFunc.escape = templateFunc.escape;
            const generator = Function(...argNames, funcBody).apply(contextFunc, argValues);
            return iterateGenerator(generator);
        }
        catch (error) {
            error.message += `\nat function (${argNames.join(", ")}) {\n${funcBody}\n})(${argValues.map(t => typeof t === "string" ? `"${t}"` : t).join(", ")})`;
            throw error;
        }
    };
    templateFunc.verbose = Nostache.verbose;
    templateFunc.escape = escape;
    templateFunc.toString = () => funcBody;
    return templateFunc;
};
Nostache.verbose = false;
Nostache.escape = escape;return Nostache;}));//# sourceMappingURL=nostache.js.map
