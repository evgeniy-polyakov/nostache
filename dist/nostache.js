(function(g,f){typeof exports==='object'&&typeof module!=='undefined'?module.exports=f():typeof define==='function'&&define.amd?define(f):(g=typeof globalThis!=='undefined'?globalThis:g||self,g.Nostache=f());})(this,(function(){'use strict';const templateCache = {};
// todo errors for unfinished expressions
// todo extension functions
// todo support of older browsers
// todo expressions like <{ const f = {@ (a,b,c) <div>Inner Template {=i=}<div/> @} }> for inner templates in JS strings
// todo output {=  =} or {~  ~} as whitespace `  `
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
    const isAlphabetic = (c) => c === 95 || (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
    const isAlphanumeric = (c) => isAlphabetic(c) || (c >= 48 && c <= 57);
    const OPEN_ANGLE = charCode("<");
    const CLOSE_ANGLE = charCode(">");
    const OPEN_BRACE = charCode("{");
    const CLOSE_BRACE = charCode("}");
    const OPEN_PARENTHESES = charCode("(");
    charCode(")");
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
    const AT_SIGN = charCode("@");
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
                `yield this.escapeHtml(${template.slice(startIndex, index)});\n`;
        }
    };
    const appendLogic = () => {
        if (index > startIndex) {
            funcBody += `${template.slice(startIndex, index)}`;
        }
    };
    const parseOpenBlock = (c) => {
        const n = template.charCodeAt(index + 1);
        if (c === OPEN_ANGLE && n === OPEN_BRACE) {
            // Logic block <{
            appendResult();
            index += 2;
            parseLogicBlock();
            return true;
        }
        else if (c === OPEN_BRACE && n === ASSIGN) {
            // Assignment block {=
            appendResult();
            index += 2;
            parseOutputBlock(false);
            return true;
        }
        else if (c === OPEN_BRACE && n === TILDE) {
            // Unsafe assignment block {~
            appendResult();
            index += 2;
            parseOutputBlock(true);
            return true;
        }
        else if (c === OPEN_BRACE && n === AT_SIGN) {
            // Declaration block {@
            appendResult();
            index += 2;
            parseDeclaration();
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
        let isPotentialHtml = true; // We can start html block right away
        for (; index < length;) {
            if (parseStringOrComment()) {
                isPotentialHtml = false;
                continue;
            }
            const c = template.charCodeAt(index);
            if (c === OPEN_BRACE) {
                index++;
                const n = template.charCodeAt(index);
                if (n === CLOSE_ANGLE) {
                    isPotentialHtml = false;
                    appendLogic();
                    index++;
                    parseTextBlock();
                }
                else if (n === ASSIGN || n === TILDE) {
                    isPotentialHtml = false;
                    appendLogic();
                    index++;
                    parseOutputBlock(n === TILDE);
                    startIndex--;
                }
                else if (n === AT_SIGN) {
                    isPotentialHtml = false;
                    index--;
                    appendLogic();
                    index += 2;
                    parseDeclaration();
                }
                else {
                    isPotentialHtml = true;
                }
            }
            else if (isPotentialHtml && isWhitespace[c]) {
                index++;
            }
            else if (isPotentialHtml && c === OPEN_ANGLE) {
                isPotentialHtml = false;
                appendLogic();
                parseHtmlBlock();
            }
            else if (c === CLOSE_BRACE && template.charCodeAt(index + 1) === CLOSE_ANGLE) {
                appendLogic();
                index += 2;
                break;
            }
            else {
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
    const parseDeclaration = () => {
        startIndex = index;
        let firstChar = 0;
        let potentialName = false;
        let name = '';
        for (; index < length;) {
            let c = template.charCodeAt(index);
            if (!firstChar) {
                c = skipWhitespace(c);
                startIndex = index;
                firstChar = c;
                if (c === OPEN_PARENTHESES) {
                    index++;
                    break;
                }
                else if (c === APOSTROPHE || c === QUOTE || c === BACKTICK) {
                    parseFetchDeclaration();
                    break;
                }
                else if (isAlphabetic(firstChar)) {
                    index++;
                    potentialName = true;
                }
                else {
                    parseParametersDeclaration();
                    break;
                }
            }
            else if (potentialName && isAlphanumeric(c)) {
                index++;
            }
            else if (potentialName && !isAlphanumeric(c)) {
                name = template.slice(startIndex, index);
                c = skipWhitespace(c);
                if (c === OPEN_PARENTHESES) {
                    index++;
                    startIndex = index;
                    break;
                }
                else if (c === APOSTROPHE || c === QUOTE || c === BACKTICK) {
                    startIndex = index;
                    parseFetchDeclaration(name);
                    break;
                }
                else {
                    parseParametersDeclaration();
                    break;
                }
            }
            else {
                parseParametersDeclaration();
                break;
            }
        }
        skipWhitespace(template.charCodeAt(index));
        startIndex = index;
    };
    const parseParametersDeclaration = () => {
        while (index < length) {
            if (template.charCodeAt(index) === AT_SIGN && template.charCodeAt(index + 1) === CLOSE_BRACE && index > startIndex) {
                funcBody += `let[${template.slice(startIndex, index)}]=this;\n`;
                index += 2;
                break;
            }
            else {
                index++;
            }
        }
    };
    const parseFetchDeclaration = (name) => {
        while (index < length) {
            if (template.charCodeAt(index) === AT_SIGN && template.charCodeAt(index + 1) === CLOSE_BRACE && index > startIndex) {
                if (name)
                    funcBody += `let ${name}=`;
                funcBody += `await this.fetch(${template.slice(startIndex, index)});\n`;
                index += 2;
                break;
            }
            else {
                index++;
            }
        }
    };
    const skipWhitespace = (c) => {
        while (index < length && isWhitespace[c]) {
            index++;
            c = template.charCodeAt(index);
        }
        return c;
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
const escapeHtml = async (value) => {
    return String(await value).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
};
const fetchTemplate = async (input, init) => {
    const response = await fetch(input, init);
    return Nostache(await response.text());
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
    if (templateCache[template]) {
        return templateCache[template];
    }
    const funcBody = parseTemplate(template);
    const templateFunc = async (...context) => {
        try {
            if (templateFunc.verbose) {
                console.groupCollapsed(`(function () {`);
                console.log(`${funcBody}})\n(`, ...context.reduce((a, t) => {
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
            contextFunc[Symbol.iterator] = function* () {
                yield* context;
            };
            for (let i = 0; i < context.length; i++) {
                contextFunc[i] = context[i];
            }
            contextFunc.fetch = templateFunc.fetch;
            contextFunc.escapeHtml = templateFunc.escapeHtml;
            contextFunc.toString = templateFunc.toString;
            const generator = Function(funcBody).apply(contextFunc);
            return iterateGenerator(generator);
        }
        catch (error) {
            error.message += `\nat function () {\n${funcBody}\n})(${context.map(t => typeof t === "string" ? `"${t}"` : t).join(", ")})`;
            throw error;
        }
    };
    templateFunc.verbose = Nostache.verbose;
    templateFunc.fetch = Nostache.fetch;
    templateFunc.escapeHtml = escapeHtml;
    templateFunc.toString = () => funcBody;
    templateCache[template] = templateFunc;
    return templateFunc;
};
Nostache.verbose = false;
Nostache.fetch = fetchTemplate;
Nostache.escapeHtml = escapeHtml;return Nostache;}));//# sourceMappingURL=nostache.js.map
