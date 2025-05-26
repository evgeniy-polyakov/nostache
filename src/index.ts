export type ContextFunction<TArgument, TExtensions extends Record<string, unknown> = Record<string, unknown>, TExtensionName extends keyof TExtensions = keyof TExtensions> = {
    (this: ContextFunction<TArgument, TExtensions, TExtensionName>, ...args: TArgument[]): Promise<string>,
    [arg: number]: TArgument,
} & Iterable<TArgument> & {
    escape(value: unknown): Promise<string>,
    import(value: string | Promise<string>): TemplateFunction;
} & {
    [name in TExtensionName]: TExtensions[TExtensionName];
};
export type TemplateFunction = {
    <TArgument>(...args: TArgument[]): Promise<string>;
    toString(): string;
};
export type TemplateOptions = {
    verbose?: boolean;
    async?: boolean;
    cache?: boolean | "import" | "function";
    import?(value: string): string | Promise<string>;
    escape?(value: string): string | Promise<string>;
    extensions: Record<string, unknown>;
};
export type TemplateCache = {
    get(key: string, options?: "function" | "async"): TemplateFunction;
    get(key: string, options: "import"): string;
    set(key: string, value: TemplateFunction, options?: "function" | "async"): void;
    set(key: string, value: string): void;
    delete(key: string, options?: "import" | "function" | "async"): void;
    clear(options?: "import" | "function" | "async"): void;
};
const ASYNC = "async";
const IMPORT = "import";
const FUNCTION = "function";
const isString = (s: unknown): s is string => typeof s === "string";
const isFunction = (f: unknown): f is { (...args: any): any } => typeof f === FUNCTION;

const parseTemplate = (template: string, options: TemplateOptions) => {

    const WHITESPACE = " ".charCodeAt(0);
    const TAB = "\t".charCodeAt(0);
    const RETURN = "\r".charCodeAt(0);
    const NEWLINE = "\n".charCodeAt(0);
    const UNDERSCORE = "_".charCodeAt(0);
    const LOWERCASE_A = "a".charCodeAt(0);
    const LOWERCASE_Z = "z".charCodeAt(0);
    const UPPERCASE_A = "A".charCodeAt(0);
    const UPPERCASE_Z = "Z".charCodeAt(0);
    const NUMBER_0 = "0".charCodeAt(0);
    const NUMBER_9 = "9".charCodeAt(0);
    const OPEN_ANGLE = "<".charCodeAt(0);
    const CLOSE_ANGLE = ">".charCodeAt(0);
    const OPEN_BRACE = "{".charCodeAt(0);
    const CLOSE_BRACE = "}".charCodeAt(0);
    const OPEN_PARENTHESES = "(".charCodeAt(0);
    const CLOSE_PARENTHESES = ")".charCodeAt(0);
    const OPEN_BRACKET = "[".charCodeAt(0);
    const CLOSE_BRACKET = "]".charCodeAt(0);
    const ASSIGN = "=".charCodeAt(0);
    const TILDE = "~".charCodeAt(0);
    const SLASH = "/".charCodeAt(0);
    const ASTERISK = "*".charCodeAt(0);
    const BACKSLASH = "\\".charCodeAt(0);
    const APOSTROPHE = "'".charCodeAt(0);
    const QUOTE = "\"".charCodeAt(0);
    const BACKTICK = "`".charCodeAt(0);
    const DOLLAR = "$".charCodeAt(0);
    const AT_SIGN = "@".charCodeAt(0);
    const COMMA = ",".charCodeAt(0);
    const PERIOD = ".".charCodeAt(0);
    const isWhitespace = (c: number) => c === WHITESPACE || c === TAB || c === RETURN || c === NEWLINE;
    const isAlphabetic = (c: number) => c === UNDERSCORE || (c >= LOWERCASE_A && c <= LOWERCASE_Z) || (c >= UPPERCASE_A && c <= UPPERCASE_Z);
    const isAlphanumeric = (c: number) => isAlphabetic(c) || (c >= NUMBER_0 && c <= NUMBER_9);
    const asyncModifier = options.async ? "async " : "";
    const charAt = (i: number) => template.charCodeAt(i);

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
                `yield (${template.slice(startIndex, index)});\n` :
                `yield this.escape(${template.slice(startIndex, index)});\n`;
        }
    };

    const appendLogic = () => {
        if (index > startIndex) {
            funcBody += template.slice(startIndex, index);
        }
    };

    const throwEndOfBlockExpected = (block: string) => {
        throw new SyntaxError(`Expected end of ${block} at\n${template}`);
    };

    const throwEndOfDeclarationBlockExpected = () => throwEndOfBlockExpected("declaration block @}");

    const parseOpenBlock = (c: number) => {
        const n = charAt(index + 1);
        if (c === OPEN_ANGLE && n === OPEN_BRACE) {
            // Logic block <{
            appendResult();
            index += 2;
            parseLogicBlock();
            return true;
        } else if (c === OPEN_BRACE && n === ASSIGN) {
            // Assignment block {=
            appendResult();
            index += 2;
            parseOutputBlock(false);
            return true;
        } else if (c === OPEN_BRACE && n === TILDE) {
            // Unescape assignment block {~
            appendResult();
            index += 2;
            parseOutputBlock(true);
            return true;
        } else if (c === OPEN_BRACE && n === AT_SIGN) {
            // Declaration block {@
            appendResult();
            index += 2;
            parseDeclaration();
            return true;
        } else if (c === BACKSLASH) {
            // escape backslash \
            appendResult(index, "\\\\");
            index++;
            startIndex = index;
            return true;
        } else if (c === BACKTICK) {
            // escape backtick
            appendResult(index, "\\`");
            index++;
            startIndex = index;
            return true;
        } else if (c === DOLLAR) {
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
            if (c === OPEN_BRACE) {
                index++;
                const n = charAt(index);
                if (n === ASSIGN || n === TILDE) {
                    isPotentialHtml = false;
                    appendLogic();
                    index++;
                    parseOutputBlock(n === TILDE);
                    startIndex--;
                } else if (n === AT_SIGN) {
                    isPotentialHtml = false;
                    index--;
                    appendLogic();
                    index += 2;
                    parseDeclaration();
                } else {
                    isPotentialHtml = true;
                }
            } else if (isPotentialHtml && isWhitespace(c)) {
                index++;
            } else if (isPotentialHtml && c === OPEN_ANGLE) {
                isPotentialHtml = false;
                appendLogic();
                parseHtmlBlock();
            } else if (isPotentialHtml && c === CLOSE_ANGLE) {
                isPotentialHtml = false;
                appendLogic();
                index++;
                parseTextBlock();
            } else if (c === CLOSE_BRACE && charAt(index + 1) === CLOSE_ANGLE) {
                appendLogic();
                index += 2;
                startIndex = index;
                return;
            } else {
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
            } else if (c === CLOSE_ANGLE) {
                index++;
                potentialEnd = index;
            } else if (potentialEnd >= 0 && isWhitespace(c)) {
                index++;
            } else if (potentialEnd >= 0 && parseStringOrComment(true)) {
                // continue
            } else if (potentialEnd >= 0 && c === CLOSE_BRACE) {
                appendResult(potentialEnd);
                startIndex = index;
                return;
            } else {
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
            } else if (c === OPEN_ANGLE) {
                potentialEnd = index;
                index++;
            } else if (potentialEnd >= 0 && isWhitespace(c)) {
                index++;
            } else if (potentialEnd >= 0 && c === CLOSE_BRACE) {
                appendResult(potentialEnd);
                startIndex = index;
                return;
            } else {
                index++;
                potentialEnd = -1;
            }
        }
        throwEndOfBlockExpected("text block <}");
    };

    const parseOutputBlock = (unsafe: boolean) => {
        startIndex = index;
        const closeChar = unsafe ? TILDE : ASSIGN;
        let hasMeaningfulSymbol = false;
        let hasOnlyComment = false;
        while (index < length) {
            const sc = parseStringOrComment();
            if (sc === 1) {
                hasMeaningfulSymbol = true;
                continue;
            } else if (sc === 2 && !hasMeaningfulSymbol) {
                hasOnlyComment = true;
                startIndex = index;
            }
            const c = charAt(index);
            if (!hasMeaningfulSymbol && isWhitespace(c)) {
                index++;
            } else if (c === closeChar && charAt(index + 1) === CLOSE_BRACE) {
                if (hasMeaningfulSymbol) {
                    appendOutput(unsafe);
                } else if (!hasOnlyComment) {
                    funcBody += `yield \`${template.slice(startIndex, index)}\`;`;
                }
                index += 2;
                startIndex = index;
                return;
            } else {
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
            if (!onlyComment && !isInString && !isInComment && (c === APOSTROPHE || c === QUOTE || c === BACKTICK)) {
                isInString = c;
                index++;
                result = 1;
            } else if (isInString && c === BACKSLASH) {
                index += 2;
            } else if (isInString && c === isInString) {
                index++;
                return 1;
            } else if (!isInString && !isInComment && c === SLASH && ((n = charAt(index + 1)) === SLASH || n === ASTERISK)) {
                isInComment = n;
                index += 2;
                result = 2;
            } else if (isInComment === SLASH && c === NEWLINE) {
                index++;
                return 2;
            } else if (isInComment === ASTERISK && c === ASTERISK && charAt(index + 1) === SLASH) {
                index += 2;
                return 2;
            } else if (isInComment || isInString) {
                index++;
            } else {
                return 0;
            }
        }
        if (result && isInString) {
            throwEndOfBlockExpected(`string ${String.fromCharCode(isInString)}`);
        }
        if (result && isInComment === ASTERISK) {
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
                if (c === OPEN_PARENTHESES) {
                    index++;
                    parseFunctionDeclaration();
                    break;
                } else if (isAlphabetic(firstChar)) {
                    index++;
                    potentialName = true;
                } else if (c === AT_SIGN && charAt(index + 1) === CLOSE_BRACE) {
                    index += 2;
                    startIndex = index;
                    return;
                } else if (c === OPEN_BRACE || c === OPEN_BRACKET || c === PERIOD || c === COMMA) {
                    parseParametersDeclaration();
                    break;
                } else {
                    parseImportDeclaration();
                    break;
                }
            } else if (potentialName && isAlphanumeric(c)) {
                index++;
            } else if (potentialName && !isAlphanumeric(c)) {
                name = template.slice(startIndex, index);
                c = skipWhitespace();
                if (parseStringOrComment(true)) {
                    c = skipWhitespace();
                }
                if (c === OPEN_PARENTHESES) {
                    index++;
                    parseFunctionDeclaration(name);
                    break;
                } else if (c === COMMA || (c === AT_SIGN && charAt(index + 1) === CLOSE_BRACE)) {
                    parseParametersDeclaration();
                    break;
                } else {
                    startIndex = index;
                    parseImportDeclaration(name);
                    break;
                }
            } else {
                parseImportDeclaration();
                break;
            }
        }
        skipWhitespace();
        startIndex = index;
    };

    const parseParametersDeclaration = () => {
        while (index < length) {
            if (parseStringOrComment(true)) {
                // continue
            } else if (charAt(index) === AT_SIGN && charAt(index + 1) === CLOSE_BRACE && index > startIndex) {
                funcBody += `let[${template.slice(startIndex, index)}]=this;\n`;
                index += 2;
                return;
            } else {
                index++;
            }
        }
        throwEndOfDeclarationBlockExpected();
    };

    const parseImportDeclaration = (name?: string) => {
        while (index < length) {
            if (parseStringOrComment(true)) {
                // continue
            } else if (charAt(index) === AT_SIGN && charAt(index + 1) === CLOSE_BRACE && index > startIndex) {
                if (name) funcBody += `let ${name}=`;
                funcBody += `this.import(${template.slice(startIndex, index)})\n`;
                index += 2;
                return;
            } else {
                index++;
            }
        }
        throwEndOfDeclarationBlockExpected();
    };

    const parseFunctionDeclaration = (name?: string) => {
        startIndex = index;
        let parameters = "";
        let parentheses = 0;
        while (index < length) {
            const c = charAt(index);
            if (c === OPEN_PARENTHESES) {
                parentheses++;
            } else if (c === CLOSE_PARENTHESES) {
                if (parentheses) {
                    parentheses--;
                    index++;
                } else {
                    parameters = template.slice(startIndex, index);
                    index++;
                    skipWhitespace();
                    startIndex = index;
                    break;
                }
            } else {
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
            } else if (c === AT_SIGN && charAt(index + 1) === CLOSE_BRACE) {
                appendResult(lastWhitespace > -1 ? lastWhitespace : index);
                const innerFuncBody = funcBody;
                funcBody = tempFuncBody;
                if (name) {
                    funcBody += `let ${name}=`;
                }
                funcBody += `(${asyncModifier}${FUNCTION}*(${parameters}){${innerFuncBody}}.bind(this))\n`;
                index += 2;
                return;
            } else if (parseOpenBlock(c)) {
                // continue
            } else {
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
        if (parseOpenBlock(c)) {
            // continue
        } else {
            index++;
        }
    }
    appendResult();
    return `return(${asyncModifier}${FUNCTION}*(){\n${funcBody}}).call(this)`;
};

const iterateRecursively = (value: any) => {
    if (value && isFunction(value.next)) {
        let result = "";
        const loop = () => new Promise(r => r(value.next())).then((chunk: any): string | Promise<string> =>
            chunk.done ? result : iterateRecursively(chunk.value).then(s => result = result + s).then(loop));
        return loop().then(() => result);
    }
    return new Promise<string>(r => r(value));
};

const isBrowser = Function("try{return this===window;}catch(e){}")();

const Nostache: {
    (template: string | Promise<string>, options?: TemplateOptions): TemplateFunction;
    readonly options: TemplateOptions,
    readonly cache: TemplateCache,
} = ((template: string | Promise<string>, options?: TemplateOptions): TemplateFunction => {
    options = {
        ...Nostache.options,
        ...options
    };
    const extensions = {
        ...(Nostache.options ? Nostache.options.extensions : undefined),
        ...(options ? options.extensions : undefined)
    };
    const cache = options.cache;
    const isAllCache = cache === undefined || cache === true;
    const isImportCache = isAllCache || cache === IMPORT;
    const isFunctionCache = isAllCache || cache === FUNCTION;
    const escapeFunc = (value: unknown) => {
        return iterateRecursively(value).then(
            isFunction(options.escape) ? options.escape :
                (s => s === undefined || s === null ? "" : String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)));
    };
    const importFunc = (value: string | Promise<string>) => (...args: unknown[]): Promise<string> => {
        return Nostache(new Promise<string>(r => r(value)).then(
            value => new Promise<string>((res, rej) => {
                value = String(value);
                const cachedTemplate = isImportCache ? Nostache.cache.get(value, IMPORT) : undefined;
                if (cachedTemplate !== undefined) {
                    res(cachedTemplate);
                } else {
                    const cacheAndResolve = (template: string) => {
                        if (isImportCache) {
                            Nostache.cache.set(value, template);
                        }
                        res(template);
                    };
                    try {
                        const optionsImport = options.import;
                        if (isFunction(optionsImport)) {
                            new Promise<string>(r => r(optionsImport(value))).then(cacheAndResolve);
                        } else if (isBrowser) {
                            fetch(value).then(response => response.status === 200 ? response.text().then(cacheAndResolve) : rej(new Error(`${response.status} ${response.url}`)));
                        } else {
                            require("fs").readFile(value, "utf8", (error: any, data: string) => error ? rej(error) : cacheAndResolve(data));
                        }
                    } catch (e) {
                        rej(e);
                    }
                }
            })), options)(...args);
    };
    const returnFunc = (...args: unknown[]): Promise<string> =>
        new Promise<string>(r => r(template))
            .then((templateString: string) => {
                const cacheOptions = options.async ? ASYNC : undefined;
                let templateFunc = isFunctionCache ? Nostache.cache.get(templateString, cacheOptions) : undefined;
                const templateFuncBody = templateFunc ? templateFunc.toString() : parseTemplate(templateString, options);
                returnFunc.toString = () => `${FUNCTION} () {\n${templateFuncBody}\n}`;
                try {
                    if (!templateFunc) {
                        templateFunc = Function(templateFuncBody) as TemplateFunction;
                        templateFunc.toString = () => templateFuncBody;
                        if (isFunctionCache) {
                            Nostache.cache.set(templateString, templateFunc, cacheOptions);
                        }
                    }
                    if (options.verbose) {
                        console.groupCollapsed(`(${FUNCTION} () {`);
                        console.log(`${templateFuncBody}})\n(`, ...(args as any[]).reduce((a, t) => {
                            if (a.length > 0) a.push(",");
                            a.push(isString(t) ? `"${t}"` : t);
                            return a;
                        }, []), ")")
                        console.groupEnd();
                    }
                    const contextFunc = ((...args: unknown[]) => returnFunc(...args)) as ContextFunction<unknown>;
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
                } catch (error: any) {
                    error.message += `\nat ${FUNCTION} () {\n${templateFuncBody}\n})(${
                        args.map(t => isString(t) ? `"${t}"` : t).join(", ")
                    })`;
                    throw error;
                }
            });
    return returnFunc;
}) as typeof Nostache;

(Nostache as { options: TemplateOptions }).options = {} as TemplateOptions;
(Nostache as { cache: TemplateCache }).cache = (() => {
    const cache = {
        [IMPORT]: {} as Record<string, string>,
        [ASYNC]: {} as Record<string, TemplateFunction>,
        [FUNCTION]: {} as Record<string, TemplateFunction>,
    };
    return {
        get(key: string, options?: "import" | "function" | "async") {
            return cache[options || FUNCTION][key];
        },
        set(key: string, value: TemplateFunction | string, options?: "function" | "async") {
            cache[isString(value) ? IMPORT : (options || FUNCTION)][key] = value;
        },
        delete(key: string, options?: "import" | "function" | "async") {
            delete cache[options || FUNCTION][key];
        },
        clear(options?: "import" | "function" | "async") {
            if (options) {
                cache[options] = {};
            } else {
                cache[IMPORT] = {};
                cache[ASYNC] = {};
                cache[FUNCTION] = {};
            }
        },
    } as TemplateCache;
})();

export default Nostache;