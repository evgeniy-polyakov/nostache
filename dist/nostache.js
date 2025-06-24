// nostache.js@1.2.2
(function(g,f){typeof exports==='object'&&typeof module!=='undefined'?module.exports=f():typeof define==='function'&&define.amd?define(f):(g=typeof globalThis!=='undefined'?globalThis:g||self,g.Nostache=f());})(this,(function(){'use strict';const ASYNC = "async";
const IMPORT = "import";
const FUNCTION = "function";
const isString = (s) => typeof s === "string";
const isFunction = (f) => typeof f === FUNCTION;
const isNostache = Symbol("Nostache");
const parseTemplate = (template, options) => {
    const isWhitespace = (c) => c === 32 || c === 9 || c === 13 || c === 10;
    const isAlphabetic = (c) => c === 95 || (c >= 97 && c <= 122) || (c >= 65 && c <= 90);
    const isAlphanumeric = (c) => isAlphabetic(c) || (c >= 48 && c <= 57);
    const asyncModifier = options.async ? "async " : "";
    const charAt = (i) => template.charCodeAt(i);
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
            funcBody += `${template.slice(startIndex, index)}\n`;
        }
    };
    const throwEndOfBlockExpected = (block) => {
        throw new SyntaxError(`Expected end of ${block} at\n${template}`);
    };
    const throwEndOfDeclarationBlockExpected = () => throwEndOfBlockExpected("declaration block @}");
    const parseOpenBlock = (c) => {
        const n = charAt(index + 1);
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
        let isPotentialHtml = false;
        while (index < length) {
            if (parseStringOrComment()) {
                continue;
            }
            const c = charAt(index);
            if (c === 123) {
                index++;
                const n = charAt(index);
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
            else if (c === 125 && charAt(index + 1) === 62) {
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
            const c = charAt(index);
            if (parseOpenBlock(c)) {
                potentialEnd = -1;
            }
            else if (c === 62) {
                index++;
                potentialEnd = index;
            }
            else if (potentialEnd >= 0 && isWhitespace(c)) {
                index++;
            }
            else if (potentialEnd >= 0 && parseStringOrComment(true)) ;
            else if (potentialEnd >= 0 && c === 125) {
                appendResult(potentialEnd);
                startIndex = index;
                return;
            }
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
        while (index < length) {
            const c = charAt(index);
            if (parseOpenBlock(c)) {
                potentialEnd = -1;
            }
            else if (c === 60) {
                potentialEnd = index;
                index++;
            }
            else if (potentialEnd >= 0 && isWhitespace(c)) {
                index++;
            }
            else if (potentialEnd >= 0 && c === 125) {
                appendResult(potentialEnd);
                startIndex = index;
                return;
            }
            else {
                index++;
                potentialEnd = -1;
            }
        }
        throwEndOfBlockExpected("text block <}");
    };
    const parseOutputBlock = (unsafe) => {
        startIndex = index;
        const closeChar = unsafe ? 126 : 61;
        let hasMeaningfulSymbol = false;
        let hasOnlyComment = false;
        while (index < length) {
            const sc = parseStringOrComment();
            if (sc === 1) {
                hasMeaningfulSymbol = true;
                continue;
            }
            else if (sc === 2 && !hasMeaningfulSymbol) {
                hasOnlyComment = true;
                startIndex = index;
            }
            const c = charAt(index);
            if (!hasMeaningfulSymbol && isWhitespace(c)) {
                index++;
            }
            else if (c === closeChar && charAt(index + 1) === 125) {
                if (hasMeaningfulSymbol) {
                    appendOutput(unsafe);
                }
                else if (!hasOnlyComment) {
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
    const parseStringOrComment = (onlyComment = false) => {
        let isInString = 0;
        let isInComment = 0;
        let result = 0;
        while (index < length) {
            const c = charAt(index);
            let n = 0;
            if (!onlyComment && !isInString && !isInComment && (c === 39 || c === 34 || c === 96)) {
                isInString = c;
                index++;
                result = 1;
            }
            else if (isInString && c === 92) {
                index += 2;
            }
            else if (isInString && c === isInString) {
                index++;
                return 1;
            }
            else if (!isInString && !isInComment && c === 47 && ((n = charAt(index + 1)) === 47 || n === 42)) {
                isInComment = n;
                index += 2;
                result = 2;
            }
            else if (isInComment === 47 && c === 10) {
                index++;
                return 2;
            }
            else if (isInComment === 42 && c === 42 && charAt(index + 1) === 47) {
                index += 2;
                return 2;
            }
            else if (isInComment || isInString) {
                index++;
            }
            else {
                return 0;
            }
        }
        if (result && isInString) {
            throwEndOfBlockExpected(`string ${String.fromCharCode(isInString)}`);
        }
        if (result && isInComment === 42) {
            throwEndOfBlockExpected("comment */");
        }
        return result;
    };
    const parseDeclaration = () => {
        startIndex = index;
        let firstChar = 0;
        let potentialName = false;
        let name = "";
        while (index < length) {
            let c = charAt(index);
            if (!firstChar) {
                c = skipWhitespace();
                if (parseStringOrComment(true)) {
                    c = skipWhitespace();
                }
                startIndex = index;
                firstChar = c;
                if (c === 40) {
                    index++;
                    parseFunctionDeclaration();
                    break;
                }
                else if (isAlphabetic(firstChar)) {
                    index++;
                    potentialName = true;
                }
                else if (c === 64 && charAt(index + 1) === 125) {
                    index += 2;
                    startIndex = index;
                    return;
                }
                else if (c === 123 || c === 91 || c === 46 || c === 44) {
                    parseParametersDeclaration();
                    break;
                }
                else {
                    parseImportDeclaration();
                    break;
                }
            }
            else if (potentialName && isAlphanumeric(c)) {
                index++;
            }
            else if (potentialName && !isAlphanumeric(c)) {
                name = template.slice(startIndex, index);
                c = skipWhitespace();
                if (parseStringOrComment(true)) {
                    c = skipWhitespace();
                }
                if (c === 40) {
                    index++;
                    parseFunctionDeclaration(name);
                    break;
                }
                else if (c === 44 || (c === 64 && charAt(index + 1) === 125)) {
                    parseParametersDeclaration();
                    break;
                }
                else {
                    startIndex = index;
                    parseImportDeclaration(name);
                    break;
                }
            }
            else {
                parseImportDeclaration();
                break;
            }
        }
        skipWhitespace();
        startIndex = index;
    };
    const parseParametersDeclaration = () => {
        while (index < length) {
            if (parseStringOrComment(true)) ;
            else if (charAt(index) === 64 && charAt(index + 1) === 125 && index > startIndex) {
                funcBody += `let[${template.slice(startIndex, index)}]=this;\n`;
                index += 2;
                return;
            }
            else {
                index++;
            }
        }
        throwEndOfDeclarationBlockExpected();
    };
    const parseImportDeclaration = (name) => {
        while (index < length) {
            if (parseStringOrComment(true)) ;
            else if (charAt(index) === 64 && charAt(index + 1) === 125 && index > startIndex) {
                if (name)
                    funcBody += `let ${name}=`;
                funcBody += `this.import(${template.slice(startIndex, index)})\n`;
                index += 2;
                return;
            }
            else {
                index++;
            }
        }
        throwEndOfDeclarationBlockExpected();
    };
    const parseFunctionDeclaration = (name) => {
        startIndex = index;
        let parameters = "";
        let parentheses = 0;
        while (index < length) {
            const c = charAt(index);
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
                    skipWhitespace();
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
            const c = charAt(index);
            if (isWhitespace(c)) {
                lastWhitespace = index;
                skipWhitespace();
            }
            else if (c === 64 && charAt(index + 1) === 125) {
                appendResult(lastWhitespace > -1 ? lastWhitespace : index);
                const innerFuncBody = funcBody;
                funcBody = tempFuncBody;
                if (name) {
                    funcBody += `let ${name}=`;
                }
                funcBody += `(${asyncModifier}${FUNCTION}*(${parameters}){${innerFuncBody}}.bind(this))\n`;
                index += 2;
                return;
            }
            else if (parseOpenBlock(c)) ;
            else {
                index++;
            }
        }
        throwEndOfDeclarationBlockExpected();
    };
    const skipWhitespace = () => {
        let c = charAt(index);
        while (index < length && isWhitespace(c)) {
            index++;
            c = charAt(index);
        }
        return c;
    };
    while (index < length) {
        const c = charAt(index);
        if (parseOpenBlock(c)) ;
        else {
            index++;
        }
    }
    appendResult();
    return `return(${asyncModifier}${FUNCTION}*(){\n${funcBody}}).call(this)`;
};
const iterateRecursively = (value) => {
    if (value && isFunction(value.next)) {
        let result = "";
        const loop = () => new Promise(r => r(value.next())).then((chunk) => {
            const v = chunk.value;
            const d = chunk.done;
            if (d && v === undefined) {
                return result;
            }
            const p = iterateRecursively(v).then(s => result = result + s);
            return d ? p : p.then(loop);
        });
        return loop().then(() => result);
    }
    if (value && value[isNostache]) {
        return value(isNostache);
    }
    return new Promise(r => r(value));
};
const isBrowser = Function("try{return this===window;}catch(e){}")();
const Nostache = ((template, options) => {
    options = Object.assign(Object.assign({}, Nostache.options), options);
    const extensions = Object.assign(Object.assign({}, (Nostache.options ? Nostache.options.extensions : undefined)), (options ? options.extensions : undefined));
    const cache = options.cache;
    const isAllCache = cache === undefined || cache === true;
    const isImportCache = isAllCache || cache === IMPORT;
    const isFunctionCache = isAllCache || cache === FUNCTION;
    const escapeFunc = (value) => {
        return iterateRecursively(value).then(isFunction(options.escape) ? options.escape :
            (s => s === undefined || s === null ? "" : String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)));
    };
    const importFunc = (value) => {
        const deferImport = (...args) => Nostache(new Promise(r => r(value)).then(value => new Promise((res, rej) => {
            value = String(value);
            const cachedTemplate = isImportCache ? Nostache.cache.get(value, IMPORT) : undefined;
            if (cachedTemplate !== undefined) {
                res(cachedTemplate);
            }
            else {
                const cacheAndResolve = (template) => {
                    if (isImportCache) {
                        Nostache.cache.set(value, template);
                    }
                    res(template);
                };
                try {
                    const optionsImport = options.import;
                    if (isFunction(optionsImport)) {
                        new Promise(r => r(optionsImport(value))).then(cacheAndResolve);
                    }
                    else if (isBrowser) {
                        fetch(value).then(response => response.status === 200 ? response.text().then(cacheAndResolve) : rej(new Error(`${response.status} ${response.url}`)));
                    }
                    else if (typeof require === FUNCTION) {
                        require("fs").readFile(value, "utf8", (error, data) => error ? rej(error) : cacheAndResolve(data));
                    }
                    else {
                        import('fs').then(fs => fs.readFile(value, "utf8", (error, data) => error ? rej(error) : cacheAndResolve(data)));
                    }
                }
                catch (e) {
                    rej(e);
                }
            }
        })), options)(...args);
        deferImport[isNostache] = true;
        return deferImport;
    };
    const returnFunc = (...args) => new Promise(r => r(template))
        .then((templateString) => {
        if (args[0] === isNostache) {
            return templateString;
        }
        const cacheOptions = options.async ? ASYNC : undefined;
        let templateFunc = isFunctionCache ? Nostache.cache.get(templateString, cacheOptions) : undefined;
        const templateFuncBody = templateFunc ? templateFunc.toString() : parseTemplate(templateString, options);
        returnFunc.toString = () => `${FUNCTION} () {\n${templateFuncBody}\n}`;
        try {
            if (!templateFunc) {
                templateFunc = Function(templateFuncBody);
                templateFunc.toString = () => templateFuncBody;
                if (isFunctionCache) {
                    Nostache.cache.set(templateString, templateFunc, cacheOptions);
                }
            }
            if (options.verbose) {
                console.groupCollapsed(`(${FUNCTION} () {`);
                console.log(`${templateFuncBody}})\n(`, ...args.reduce((a, t) => {
                    if (a.length > 0)
                        a.push(",");
                    a.push(isString(t) ? `"${t}"` : t);
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
            contextFunc.import = importFunc;
            contextFunc.escape = escapeFunc;
            for (const name in extensions) {
                contextFunc[name] = extensions[name];
            }
            return iterateRecursively(templateFunc.apply(contextFunc));
        }
        catch (error) {
            error.message += `\nat ${FUNCTION} () {\n${templateFuncBody}\n})(${args.map(t => isString(t) ? `"${t}"` : t).join(", ")})`;
            throw error;
        }
    });
    returnFunc[isNostache] = true;
    return returnFunc;
});
Nostache.options = {};
Nostache.cache = (() => {
    const cache = {
        [IMPORT]: {},
        [ASYNC]: {},
        [FUNCTION]: {},
    };
    return {
        get(key, options) {
            return cache[options || FUNCTION][key];
        },
        set(key, value, options) {
            cache[isString(value) ? IMPORT : (options || FUNCTION)][key] = value;
        },
        delete(key, options) {
            delete cache[options || FUNCTION][key];
        },
        clear(options) {
            if (options) {
                cache[options] = {};
            }
            else {
                cache[IMPORT] = {};
                cache[ASYNC] = {};
                cache[FUNCTION] = {};
            }
        },
    };
})();return Nostache;}));//# sourceMappingURL=nostache.js.map
