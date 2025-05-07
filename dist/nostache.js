(function(g,f){typeof exports==='object'&&typeof module!=='undefined'?module.exports=f():typeof define==='function'&&define.amd?define(f):(g=typeof globalThis!=='undefined'?globalThis:g||self,g.Nostache=f());})(this,(function(){'use strict';const templateCache = new Map();
const parseTemplate = (template, options) => {
    const isWhitespace = (c) => c === 32 || c === 9 || c === 13 || c === 10;
    const isAlphabetic = (c) => c === 95 || (c >= 97 && c <= 122) || (c >= 65 && c <= 90);
    const isAlphanumeric = (c) => isAlphabetic(c) || (c >= 48 && c <= 57);
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
            funcBody += template.slice(startIndex, index);
        }
    };
    const throwEndOfBlockExpected = (block) => {
        throw new SyntaxError(`Expected end of ${block} at\n${template}`);
    };
    const parseOpenBlock = (c) => {
        const n = template.charCodeAt(index + 1);
        if (c === 60 && n === 123) {
            // Logic block <{
            appendResult();
            index += 2;
            parseLogicBlock();
            return true;
        }
        else if (c === 123 && n === 61) {
            // Assignment block {=
            appendResult();
            index += 2;
            parseOutputBlock(false);
            return true;
        }
        else if (c === 123 && n === 126) {
            // Unescape assignment block {~
            appendResult();
            index += 2;
            parseOutputBlock(true);
            return true;
        }
        else if (c === 123 && n === 64) {
            // Declaration block {@
            appendResult();
            index += 2;
            parseDeclaration();
            return true;
        }
        else if (c === 92) {
            // escape backslash \
            appendResult(index, "\\\\");
            index++;
            startIndex = index;
            return true;
        }
        else if (c === 96) {
            // escape backtick
            appendResult(index, "\\`");
            index++;
            startIndex = index;
            return true;
        }
        else if (c === 36) {
            // escape dollar
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
        while (index < length) {
            if (parseStringOrComment()) {
                isPotentialHtml = false;
                continue;
            }
            const c = template.charCodeAt(index);
            if (c === 123) {
                index++;
                const n = template.charCodeAt(index);
                if (n === 61 || n === 126) {
                    isPotentialHtml = false;
                    appendLogic();
                    index++;
                    parseOutputBlock(n === 126);
                    startIndex--;
                }
                else if (n === 64) {
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
            else if (isPotentialHtml && isWhitespace(c)) {
                index++;
            }
            else if (isPotentialHtml && c === 60) {
                isPotentialHtml = false;
                appendLogic();
                parseHtmlBlock();
            }
            else if (isPotentialHtml && c === 62) {
                isPotentialHtml = false;
                appendLogic();
                index++;
                parseTextBlock();
            }
            else if (c === 125 && template.charCodeAt(index + 1) === 62) {
                appendLogic();
                index += 2;
                startIndex = index;
                return;
            }
            else {
                index++;
                isPotentialHtml = false;
            }
        }
        throwEndOfBlockExpected("logic block }>");
    };
    const parseHtmlBlock = () => {
        startIndex = index;
        let potentialEnd = -1;
        while (index < length) {
            const c = template.charCodeAt(index);
            if (c === 62) {
                index++;
                potentialEnd = index;
            }
            else if (potentialEnd >= 0 && isWhitespace(c)) {
                index++;
            }
            else if (potentialEnd >= 0 && c === 125) {
                appendResult(potentialEnd);
                startIndex = index;
                return;
            }
            else if (parseOpenBlock(c)) ;
            else {
                index++;
                potentialEnd = -1;
            }
        }
        throwEndOfBlockExpected("html block >}");
    };
    const parseTextBlock = () => {
        startIndex = index;
        let potentialEnd = -1;
        let potentialEndWhitespace = -1;
        let hasMeaningfulSymbol = false;
        while (index < length) {
            const c = template.charCodeAt(index);
            if (!hasMeaningfulSymbol && isWhitespace(c)) {
                startIndex++;
                index++;
            }
            else if (parseOpenBlock(c)) {
                hasMeaningfulSymbol = true;
                potentialEnd = -1;
                potentialEndWhitespace = -1;
            }
            else if (hasMeaningfulSymbol && (c === 60 || isWhitespace(c))) {
                if (potentialEndWhitespace < 0)
                    potentialEndWhitespace = index;
                if (c === 60)
                    potentialEnd = index;
                index++;
            }
            else if (potentialEnd >= 0 && isWhitespace(c)) {
                index++;
            }
            else if (potentialEnd >= 0 && c === 125) {
                appendResult(potentialEndWhitespace);
                startIndex = index;
                return;
            }
            else {
                index++;
                potentialEnd = -1;
                potentialEndWhitespace = -1;
                hasMeaningfulSymbol = true;
            }
        }
        throwEndOfBlockExpected("text block <}");
    };
    const parseOutputBlock = (unsafe) => {
        startIndex = index;
        const closeChar = unsafe ? 126 : 61;
        let hasMeaningfulSymbol = false;
        while (index < length) {
            if (parseStringOrComment()) {
                hasMeaningfulSymbol = true;
                continue;
            }
            const c = template.charCodeAt(index);
            if (!hasMeaningfulSymbol && isWhitespace(c)) {
                index++;
            }
            else if (c === closeChar && template.charCodeAt(index + 1) === 125) {
                if (hasMeaningfulSymbol) {
                    appendOutput(unsafe);
                }
                else {
                    funcBody += `yield \`${template.slice(startIndex, index)}\`;`;
                }
                index += 2;
                startIndex = index;
                return;
            }
            else {
                index++;
                hasMeaningfulSymbol = true;
            }
        }
        throwEndOfBlockExpected(`output block ${unsafe ? "~}" : "=}"}`);
    };
    const parseStringOrComment = () => {
        let isInString = 0;
        let isInComment = 0;
        let result = false;
        while (index < length) {
            const c = template.charCodeAt(index);
            let n = 0;
            if (!isInString && !isInComment && (c === 39 || c === 34 || c === 96)) {
                isInString = c;
                index++;
                result = true;
            }
            else if (isInString && c === 92) {
                index += 2;
            }
            else if (isInString && c === isInString) {
                index++;
                return true;
            }
            else if (!isInString && !isInComment && c === 47 && ((n = template.charCodeAt(index + 1)) === 47 || n === 42)) {
                isInComment = n;
                index += 2;
                result = true;
            }
            else if (isInComment === 47 && c === 10) {
                index++;
                return true;
            }
            else if (isInComment === 42 && c === 42 && template.charCodeAt(index + 1) === 47) {
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
        if (result && isInString) {
            throwEndOfBlockExpected(`string ${String.fromCharCode(isInString)}`);
        }
        if (result && isInComment === 42) {
            throwEndOfBlockExpected(`comment */`);
        }
        return result;
    };
    const parseDeclaration = () => {
        startIndex = index;
        let firstChar = 0;
        let potentialName = false;
        let name = "";
        while (index < length) {
            let c = template.charCodeAt(index);
            if (!firstChar) {
                c = skipWhitespace(c);
                startIndex = index;
                firstChar = c;
                if (c === 40) {
                    index++;
                    parseTemplateDeclaration();
                    break;
                }
                else if (c === 39 || c === 34 || c === 96) {
                    index++;
                    parseLoadDeclaration();
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
                if (c === 40) {
                    index++;
                    parseTemplateDeclaration(name);
                    break;
                }
                else if (c === 39 || c === 34 || c === 96) {
                    startIndex = index;
                    index++;
                    parseLoadDeclaration(name);
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
            if (template.charCodeAt(index) === 64 && template.charCodeAt(index + 1) === 125 && index > startIndex) {
                funcBody += `let[${template.slice(startIndex, index)}]=this;\n`;
                index += 2;
                return;
            }
            else {
                index++;
            }
        }
        throwEndOfBlockExpected("declaration block @}");
    };
    const parseLoadDeclaration = (name) => {
        while (index < length) {
            if (template.charCodeAt(index) === 64 && template.charCodeAt(index + 1) === 125 && index > startIndex) {
                if (name)
                    funcBody += `let ${name}=`;
                funcBody += `this.load(${template.slice(startIndex, index)})\n`;
                index += 2;
                return;
            }
            else {
                index++;
            }
        }
        throwEndOfBlockExpected("declaration block @}");
    };
    const parseTemplateDeclaration = (name) => {
        startIndex = index;
        let parameters = "";
        let parentheses = 0;
        while (index < length) {
            const c = template.charCodeAt(index);
            if (c === 40) {
                parentheses++;
            }
            else if (c === 41) {
                if (parentheses) {
                    parentheses--;
                    index++;
                }
                else {
                    parameters = template.slice(startIndex, index);
                    index++;
                    skipWhitespace(template.charCodeAt(index));
                    startIndex = index;
                    break;
                }
            }
            else {
                index++;
            }
        }
        const tempFuncBody = funcBody;
        let lastWhitespace = -1;
        funcBody = "";
        while (index < length) {
            const c = template.charCodeAt(index);
            if (isWhitespace(c)) {
                lastWhitespace = index;
                index++;
            }
            else if (c === 64 && template.charCodeAt(index + 1) === 125) {
                appendResult(lastWhitespace > -1 ? lastWhitespace : index);
                const innerFuncBody = funcBody;
                funcBody = tempFuncBody;
                if (name) {
                    funcBody += `let ${name}=`;
                }
                funcBody += `(${options.async ? "async " : ""}function*(${parameters}){${innerFuncBody}}.bind(this))\n`;
                index += 2;
                return;
            }
            else if (parseOpenBlock(c)) ;
            else {
                index++;
            }
        }
        throwEndOfBlockExpected("declaration block @}");
    };
    const skipWhitespace = (c) => {
        while (index < length && isWhitespace(c)) {
            index++;
            c = template.charCodeAt(index);
        }
        return c;
    };
    while (index < length) {
        const c = template.charCodeAt(index);
        if (parseOpenBlock(c)) ;
        else {
            index++;
        }
    }
    appendResult();
    return `return(${options.async ? "async " : ""}function*(){\n${funcBody}}).call(this)`;
};
const iterateRecursively = (value) => {
    if (value && typeof value.next === "function") {
        let result = "";
        let loop = () => new Promise(r => r(value.next())).then((chunk) => chunk.done ? result : iterateRecursively(chunk.value).then(s => result = result + s).then(loop));
        return loop().then(() => result);
    }
    return new Promise(r => r(value));
};
const Nostache = ((template, options) => {
    options = Object.assign(Object.assign({}, Nostache.options), options);
    const extensions = Object.assign(Object.assign({}, (Nostache.options ? Nostache.options.extensions : undefined)), (options ? options.extensions : undefined));
    const escape = (value) => {
        return iterateRecursively(value).then(typeof options.escape === "function" ? options.escape :
            (s => s === undefined || s === null ? "" : String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)));
    };
    const load = (input, init) => (...args) => {
        const inputString = typeof input === "string" ? input : input instanceof URL ? input.toString() : "";
        let cachedTemplate = inputString ? templateCache.get(inputString) : undefined;
        if (cachedTemplate && typeof cachedTemplate !== "string") {
            cachedTemplate = undefined;
        }
        return Nostache(new Promise(r => r(cachedTemplate ? cachedTemplate :
            typeof options.load === "function" ? options.load(input, init) :
                fetch(input, init).then(r => r.text()))).then(template => {
            if (!cachedTemplate && options.cache !== false) {
                templateCache.set(inputString, template);
            }
            return template;
        }), options)(...args);
    };
    const returnFunc = (...args) => new Promise(r => r(template))
        .then((templateString) => {
        const cacheKey = options.async ? `async ${templateString}` : templateString;
        let templateFunc = templateCache.get(cacheKey);
        const templateFuncBody = templateFunc ? templateFunc.toString() : parseTemplate(templateString, options);
        returnFunc.toString = () => `function () {\n${templateFuncBody}\n}`;
        try {
            if (!templateFunc || typeof templateFunc === "string") {
                templateFunc = Function(templateFuncBody);
                templateFunc.toString = () => templateFuncBody;
                if (options.cache !== false) {
                    templateCache.set(cacheKey, templateFunc);
                }
            }
            if (options.verbose) {
                console.groupCollapsed(`(function () {`);
                console.log(`${templateFuncBody}})\n(`, ...args.reduce((a, t) => {
                    if (a.length > 0)
                        a.push(",");
                    a.push(typeof t === "string" ? `"${t}"` : t);
                    return a;
                }, []), ")");
                console.groupEnd();
            }
            const contextFunc = ((...args) => returnFunc(...args));
            contextFunc[Symbol.iterator] = function* () {
                yield* args;
            };
            for (let i = 0; i < args.length; i++) {
                contextFunc[i] = args[i];
            }
            contextFunc.load = load;
            contextFunc.escape = escape;
            for (const name in extensions) {
                contextFunc[name] = extensions[name];
            }
            return iterateRecursively(templateFunc.apply(contextFunc));
        }
        catch (error) {
            error.message += `\nat function () {\n${templateFuncBody}\n})(${args.map(t => typeof t === "string" ? `"${t}"` : t).join(", ")})`;
            throw error;
        }
    });
    return returnFunc;
});
Nostache.options = {};
Nostache.cache = templateCache;return Nostache;}));//# sourceMappingURL=nostache.js.map
