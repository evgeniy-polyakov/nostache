export type ContextFunction<TArgument, TExtensions extends Record<string, unknown> = Record<string, unknown>, TExtensionName extends keyof TExtensions = keyof TExtensions> = {
    (this: ContextFunction<TArgument, TExtensions, TExtensionName>, ...args: TArgument[]): Promise<string>,
    [arg: number]: TArgument,
} & Iterable<TArgument> & {
    escape(value: unknown): Promise<string>,
    load(input: string | URL | Request, init?: RequestInit): TemplateFunction;
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
    cache?: boolean;
    load?(input: string | URL | Request, init?: RequestInit): string | Promise<string>;
    escape?(value: string): string | Promise<string>;
    extensions: Record<string, unknown>;
};
export type TemplateCache = Map<string, string | TemplateFunction>;
const templateCache: TemplateCache = new Map<string, string | TemplateFunction>();

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
    const isWhitespace = (c: number) => c === WHITESPACE || c === TAB || c === RETURN || c === NEWLINE;
    const isAlphabetic = (c: number) => c === UNDERSCORE || (c >= LOWERCASE_A && c <= LOWERCASE_Z) || (c >= UPPERCASE_A && c <= UPPERCASE_Z);
    const isAlphanumeric = (c: number) => isAlphabetic(c) || (c >= NUMBER_0 && c <= NUMBER_9);

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

    const parseOpenBlock = (c: number) => {
        const n = template.charCodeAt(index + 1);
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
                } else if (n === ASSIGN || n === TILDE) {
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
            } else if (c === CLOSE_BRACE && template.charCodeAt(index + 1) === CLOSE_ANGLE) {
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
            const c = template.charCodeAt(index);
            if (c === CLOSE_ANGLE) {
                index++;
                potentialEnd = index;
            } else if (potentialEnd >= 0 && isWhitespace(c)) {
                index++;
            } else if (potentialEnd >= 0 && c === CLOSE_BRACE) {
                appendResult(potentialEnd);
                startIndex = index;
                return;
            } else if (parseOpenBlock(c)) {
                // continue
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
        let potentialEndWhitespace = -1;
        let hasMeaningfulSymbol = false;
        while (index < length) {
            const c = template.charCodeAt(index);
            if (!hasMeaningfulSymbol && isWhitespace(c)) {
                startIndex++;
                index++;
            } else if (parseOpenBlock(c)) {
                hasMeaningfulSymbol = true;
                potentialEnd = -1;
                potentialEndWhitespace = -1;
            } else if (hasMeaningfulSymbol && (c === OPEN_ANGLE || isWhitespace(c))) {
                if (potentialEndWhitespace < 0) potentialEndWhitespace = index;
                if (c === OPEN_ANGLE) potentialEnd = index;
                index++;
            } else if (potentialEnd >= 0 && isWhitespace(c)) {
                index++;
            } else if (potentialEnd >= 0 && c === CLOSE_BRACE) {
                appendResult(potentialEndWhitespace);
                startIndex = index;
                return;
            } else {
                index++;
                potentialEnd = -1;
                potentialEndWhitespace = -1;
                hasMeaningfulSymbol = true;
            }
        }
        throwEndOfBlockExpected("text block <}");
    };

    const parseOutputBlock = (unsafe: boolean) => {
        startIndex = index;
        const closeChar = unsafe ? TILDE : ASSIGN;
        let hasMeaningfulSymbol = false;
        while (index < length) {
            if (parseStringOrComment()) {
                hasMeaningfulSymbol = true;
                continue;
            }
            const c = template.charCodeAt(index);
            if (!hasMeaningfulSymbol && isWhitespace(c)) {
                index++;
            } else if (c === closeChar && template.charCodeAt(index + 1) === CLOSE_BRACE) {
                if (hasMeaningfulSymbol) {
                    appendOutput(unsafe);
                } else {
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

    const parseStringOrComment = () => {
        let isInString = 0;
        let isInComment = 0;
        let result = false;
        while (index < length) {
            const c = template.charCodeAt(index);
            let n = 0;
            if (!isInString && !isInComment && (c === APOSTROPHE || c === QUOTE || c === BACKTICK)) {
                isInString = c;
                index++;
                result = true;
            } else if (isInString && c === BACKSLASH) {
                index += 2;
            } else if (isInString && c === isInString) {
                index++;
                return true;
            } else if (!isInString && !isInComment && c === SLASH && ((n = template.charCodeAt(index + 1)) === SLASH || n === ASTERISK)) {
                isInComment = n;
                index += 2;
                result = true;
            } else if (isInComment === SLASH && c === NEWLINE) {
                index++;
                return true;
            } else if (isInComment === ASTERISK && c === ASTERISK && template.charCodeAt(index + 1) === SLASH) {
                index += 2;
                return true;
            } else if (isInComment || isInString) {
                index++;
            } else {
                return false;
            }
        }
        if (result && isInString) {
            throwEndOfBlockExpected(`string ${String.fromCharCode(isInString)}`);
        }
        if (result && isInComment === ASTERISK) {
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
                if (c === OPEN_PARENTHESES) {
                    index++;
                    parseTemplateDeclaration();
                    break;
                } else if (c === APOSTROPHE || c === QUOTE || c === BACKTICK) {
                    index++;
                    parseLoadDeclaration();
                    break;
                } else if (isAlphabetic(firstChar)) {
                    index++;
                    potentialName = true;
                } else {
                    parseParametersDeclaration();
                    break;
                }
            } else if (potentialName && isAlphanumeric(c)) {
                index++;
            } else if (potentialName && !isAlphanumeric(c)) {
                name = template.slice(startIndex, index);
                c = skipWhitespace(c);
                if (c === OPEN_PARENTHESES) {
                    index++;
                    parseTemplateDeclaration(name);
                    break;
                } else if (c === APOSTROPHE || c === QUOTE || c === BACKTICK) {
                    startIndex = index;
                    index++;
                    parseLoadDeclaration(name);
                    break;
                } else {
                    parseParametersDeclaration();
                    break;
                }
            } else {
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
                return;
            } else {
                index++;
            }
        }
        throwEndOfBlockExpected("declaration block @}");
    };

    const parseLoadDeclaration = (name?: string) => {
        while (index < length) {
            if (template.charCodeAt(index) === AT_SIGN && template.charCodeAt(index + 1) === CLOSE_BRACE && index > startIndex) {
                if (name) funcBody += `let ${name}=`;
                funcBody += `this.load(${template.slice(startIndex, index)})\n`;
                index += 2;
                return;
            } else {
                index++;
            }
        }
        throwEndOfBlockExpected("declaration block @}");
    };

    const parseTemplateDeclaration = (name?: string) => {
        startIndex = index;
        let parameters = "";
        let parentheses = 0;
        while (index < length) {
            const c = template.charCodeAt(index);
            if (c === OPEN_PARENTHESES) {
                parentheses++;
            } else if (c === CLOSE_PARENTHESES) {
                if (parentheses) {
                    parentheses--;
                    index++;
                } else {
                    parameters = template.slice(startIndex, index);
                    index++;
                    skipWhitespace(template.charCodeAt(index));
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
            const c = template.charCodeAt(index);
            if (isWhitespace(c)) {
                lastWhitespace = index;
                index++;
            } else if (c === AT_SIGN && template.charCodeAt(index + 1) === CLOSE_BRACE) {
                appendResult(lastWhitespace > -1 ? lastWhitespace : index);
                const innerFuncBody = funcBody;
                funcBody = tempFuncBody;
                if (name) {
                    funcBody += `let ${name}=`;
                }
                funcBody += `(${options.async ? "async " : ""}function*(${parameters}){${innerFuncBody}}.bind(this))\n`;
                index += 2;
                return;
            } else if (parseOpenBlock(c)) {
                // continue
            } else {
                index++;
            }
        }
        throwEndOfBlockExpected("declaration block @}");
    };

    const skipWhitespace = (c: number) => {
        while (index < length && isWhitespace(c)) {
            index++;
            c = template.charCodeAt(index);
        }
        return c;
    };

    while (index < length) {
        const c = template.charCodeAt(index);
        if (parseOpenBlock(c)) {
            // continue
        } else {
            index++;
        }
    }
    appendResult();
    return `return(${options.async ? "async " : ""}function*(){\n${funcBody}}).call(this)`;
};

const iterateRecursively = (value: any) => {
    if (value && typeof value.next === "function") {
        let result = "";
        let loop = () => new Promise(r => r(value.next())).then((chunk: any): string | Promise<string> =>
            chunk.done ? result : iterateRecursively(chunk.value).then(s => result = result + s).then(loop));
        return loop().then(() => result);
    }
    return new Promise<string>(r => r(value));
};

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
    const escape = (value: unknown) => {
        return iterateRecursively(value).then(
            typeof options.escape === "function" ? options.escape :
                (s => s === undefined || s === null ? "" : String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)));
    };
    const load = (input: string | URL | Request, init?: RequestInit) => (...args: unknown[]): Promise<string> => {
        const inputString = typeof input === "string" ? input : input instanceof URL ? input.toString() : "";
        let cachedTemplate = inputString ? templateCache.get(inputString) : undefined;
        if (cachedTemplate && typeof cachedTemplate !== "string") {
            cachedTemplate = undefined;
        }
        return Nostache(new Promise<string>(r => r(
            cachedTemplate ? cachedTemplate :
                typeof options.load === "function" ? options.load(input, init) :
                    fetch(input, init).then(r => r.text()))
        ).then(template => {
                if (!cachedTemplate && options.cache !== false) {
                    templateCache.set(inputString, template);
                }
                return template;
            }
        ), options)(...args);
    };
    const returnFunc = (...args: unknown[]): Promise<string> =>
        new Promise<string>(r => r(template))
            .then((templateString: string) => {
                const cacheKey = options.async ? `async ${templateString}` : templateString;
                let templateFunc = templateCache.get(cacheKey);
                const templateFuncBody = templateFunc ? templateFunc.toString() : parseTemplate(templateString, options);
                returnFunc.toString = () => `function () {\n${templateFuncBody}\n}`;
                try {
                    if (!templateFunc || typeof templateFunc === "string") {
                        templateFunc = Function(templateFuncBody) as TemplateFunction;
                        templateFunc.toString = () => templateFuncBody;
                        if (options.cache !== false) {
                            templateCache.set(cacheKey, templateFunc);
                        }
                    }
                    if (options.verbose) {
                        console.groupCollapsed(`(function () {`);
                        console.log(`${templateFuncBody}})\n(`, ...(args as any[]).reduce((a, t) => {
                            if (a.length > 0) a.push(",");
                            a.push(typeof t === "string" ? `"${t}"` : t);
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
                    contextFunc.load = load;
                    contextFunc.escape = escape;
                    for (const name in extensions) {
                        contextFunc[name] = extensions[name];
                    }
                    return iterateRecursively(templateFunc.apply(contextFunc));
                } catch (error: any) {
                    error.message += `\nat function () {\n${templateFuncBody}\n})(${
                        args.map(t => typeof t === "string" ? `"${t}"` : t).join(", ")
                    })`;
                    throw error;
                }
            });
    return returnFunc;
}) as typeof Nostache;

(Nostache as { options: TemplateOptions }).options = {} as TemplateOptions;
(Nostache as { cache: TemplateCache }).cache = templateCache;

export default Nostache;