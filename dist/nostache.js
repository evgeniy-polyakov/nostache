(function(g,f){typeof exports==='object'&&typeof module!=='undefined'?module.exports=f():typeof define==='function'&&define.amd?define(f):(g=typeof globalThis!=='undefined'?globalThis:g||self,g.Nostache=f());})(this,(function(){'use strict';/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};const templateCache = {};
// todo errors for unfinished expressions
// todo extension functions
// todo table of control characters in readme.md
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
                `yield ${template.slice(startIndex, index)};\n` :
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
        let isInString = 0;
        let isPotentialHtml = true; // We can start html block right away
        for (; index < length;) {
            const c = template.charCodeAt(index);
            if (!isInString && (c === APOSTROPHE || c === QUOTE || c === BACKTICK)) {
                isInString = c;
                index++;
                isPotentialHtml = false;
            }
            else if (isInString && c === BACKSLASH) {
                index += 2;
            }
            else if (isInString && c === isInString) {
                isInString = 0;
                index++;
            }
            else if (!isInString && c === OPEN_BRACE) {
                index++;
                isPotentialHtml = true;
            }
            else if (isPotentialHtml && isWhitespace[c]) {
                index++;
            }
            else if (isPotentialHtml && c === OPEN_ANGLE) {
                isPotentialHtml = false;
                appendLogic();
                parseHtmlBlock();
            }
            else if (isPotentialHtml && (c === ASSIGN || c === TILDE)) {
                isPotentialHtml = false;
                appendLogic();
                index++;
                parseOutputBlock(c === TILDE);
                startIndex--;
            }
            else if (!isInString && c === CLOSE_BRACE && template.charCodeAt(index + 1) === CLOSE_ANGLE) {
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
    const parseOutputBlock = (unsafe) => {
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
            }
            else if (isInString && c === BACKSLASH) {
                index += 2;
            }
            else if (isInString && c === isInString) {
                isInString = 0;
                index++;
            }
            else if (!isInString && c === closeChar && template.charCodeAt(index + 1) === CLOSE_BRACE) {
                if (hasMeaningfulSymbol) {
                    appendOutput(unsafe);
                }
                index += 2;
                break;
            }
            else if (isWhitespace[c]) {
                index++;
            }
            else {
                index++;
                hasMeaningfulSymbol = true;
            }
        }
        startIndex = index;
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
const escape = (value) => __awaiter(void 0, void 0, void 0, function* () {
    return String(yield value).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
});
const Nostache = (template) => {
    var _a;
    const funcBody = (_a = templateCache[template]) !== null && _a !== void 0 ? _a : (templateCache[template] = parseTemplate(template));
    const templateFunc = (...context) => __awaiter(void 0, void 0, void 0, function* () {
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
            const asyncGenerator = Function(...argNames, funcBody).apply(contextFunc, argValues);
            let result = "";
            while (true) {
                const chunk = yield asyncGenerator.next();
                if (chunk.done) {
                    break;
                }
                else {
                    result += chunk.value;
                }
            }
            return result;
        }
        catch (error) {
            error.message += `\nat function (${argNames.join(", ")}) {\n${funcBody}\n})(${argValues.map(t => typeof t === "string" ? `"${t}"` : t).join(", ")})`;
            throw error;
        }
    });
    templateFunc.verbose = Nostache.verbose;
    templateFunc.escape = escape;
    templateFunc.toString = () => funcBody;
    return templateFunc;
};
Nostache.verbose = false;
Nostache.escape = escape;return Nostache;}));//# sourceMappingURL=nostache.js.map
