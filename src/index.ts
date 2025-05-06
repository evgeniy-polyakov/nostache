type ContextFunction<TArg> = Iterable<TArg> & {
    (...args: TArg[]): Promise<string>,
    [arg: number]: TArg,
    escape(value: unknown): Promise<string>,
    load(input: string | URL | Request, init?: RequestInit): TemplateFunction;
};
type TemplateFunction = {
    <TArg>(this: ContextFunction<TArg>, ...context: TArg[]): Promise<string>;
    toString(): string;
};
type TemplateOptions = {
    verbose?: boolean;
    async?: boolean;
    cache?: boolean;
    load?(input: string | URL | Request, init?: RequestInit): string | Promise<string>;
    escape?(value: string): string | Promise<string>;
};
type TemplateCache = Map<string, TemplateFunction>;
const templateCache: TemplateCache = new Map<string, TemplateFunction>();

// todo errors for unfinished expressions
// todo extension functions
// todo output {=  =} or {~  ~} as whitespace `  `
// todo layout/block/region technics
// todo table of control characters in readme.md
// todo ; before yield in some cases
const parseTemplate = (template: string, options: TemplateOptions) => {

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
    const isAlphabetic = (c: number) => c === 95 || (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
    const isAlphanumeric = (c: number) => isAlphabetic(c) || (c >= 48 && c <= 57);
    const OPEN_ANGLE = charCode("<");
    const CLOSE_ANGLE = charCode(">");
    const OPEN_BRACE = charCode("{");
    const CLOSE_BRACE = charCode("}");
    const OPEN_PARENTHESES = charCode("(");
    const CLOSE_PARENTHESES = charCode(")");
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

    const appendOutput = (unescape: boolean) => {
        if (index > startIndex) {
            funcBody += unescape ?
                `yield (${template.slice(startIndex, index)});\n` :
                `yield this.escape(${template.slice(startIndex, index)});\n`;
        }
    };

    const appendLogic = () => {
        if (index > startIndex) {
            funcBody += template.slice(startIndex, index);
        }
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
        let isPotentialHtml = true; // We can start html block right away
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
    };

    const parseHtmlBlock = () => {
        startIndex = index;
        let potentialEnd = -1;
        while (index < length) {
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

    const parseTextBlock = () => {
        startIndex = index;
        let potentialEnd = -1;
        let potentialEndWhitespace = -1;
        let hasMeaningfulSymbol = false;
        while (index < length) {
            const c = template.charCodeAt(index);
            if (!hasMeaningfulSymbol && isWhitespace[c]) {
                startIndex++;
                index++;
            } else if (hasMeaningfulSymbol && (c === OPEN_ANGLE || isWhitespace[c])) {
                if (potentialEndWhitespace < 0) potentialEndWhitespace = index;
                if (c === OPEN_ANGLE) potentialEnd = index;
                index++;
            } else if (potentialEnd >= 0 && isWhitespace[c]) {
                index++;
            } else if (potentialEnd >= 0 && c === CLOSE_BRACE) {
                appendResult(potentialEndWhitespace);
                break;
            } else if (parseOpenBlock(c)) {
                hasMeaningfulSymbol = true;
            } else {
                index++;
                potentialEnd = -1;
                potentialEndWhitespace = -1;
                hasMeaningfulSymbol = true;
            }
        }
        startIndex = index;
    };

    const parseOutputBlock = (unescape: boolean) => {
        startIndex = index;
        const closeChar = unescape ? TILDE : ASSIGN;
        let hasMeaningfulSymbol = false;
        while (index < length) {
            if (parseStringOrComment()) {
                hasMeaningfulSymbol = true;
                continue;
            }
            const c = template.charCodeAt(index);
            if (!hasMeaningfulSymbol && isWhitespace[c]) {
                index++;
            } else if (c === closeChar && template.charCodeAt(index + 1) === CLOSE_BRACE) {
                if (hasMeaningfulSymbol) {
                    appendOutput(unescape);
                }
                index += 2;
                break;
            } else {
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
                isInString = 0;
                index++;
                return true;
            } else if (!isInString && !isInComment && c === SLASH && ((n = template.charCodeAt(index + 1)) === SLASH || n === ASTERISK)) {
                isInComment = n;
                index += 2;
                result = true;
            } else if (isInComment === SLASH && c === NEWLINE) {
                isInComment = 0;
                index++;
            } else if (isInComment === ASTERISK && c === ASTERISK && template.charCodeAt(index + 1) === SLASH) {
                isInComment = 0;
                index += 2;
                return true;
            } else if (isInComment || isInString) {
                index++;
            } else {
                return false;
            }
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
                    parseloadDeclaration();
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
                    parseloadDeclaration(name);
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
                break;
            } else {
                index++;
            }
        }
    };

    const parseloadDeclaration = (name?: string) => {
        while (index < length) {
            if (template.charCodeAt(index) === AT_SIGN && template.charCodeAt(index + 1) === CLOSE_BRACE && index > startIndex) {
                if (name) funcBody += `let ${name}=`;
                funcBody += `this.load(${template.slice(startIndex, index)})\n`;
                index += 2;
                break;
            } else {
                index++;
            }
        }
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
            if (isWhitespace[c]) {
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
                break;
            } else if (parseOpenBlock(c)) {
                // continue
            } else {
                index++;
            }
        }
    };

    const skipWhitespace = (c: number) => {
        while (index < length && isWhitespace[c]) {
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
    if (typeof value.next === "function") {
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
        ...options,
    };
    const escape = (value: unknown) => {
        return iterateRecursively(value).then(
            typeof options.escape === "function" ? options.escape :
                (s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)));
    };
    const load = (input: string | URL | Request, init?: RequestInit) => {
        return Nostache(typeof options.load === "function" ? options.load(input, init) : fetch(input, init).then(r => r.text()));
    };
    const templateFunc = (...args: unknown[]) =>
        new Promise<string>(r => r(template))
            .then((templateString: string) => {
                const key = options.async ? `async ${templateString}` : templateString;
                let func = templateCache.get(key);
                const funcBody = func ? func.toString() : parseTemplate(templateString, options);
                templateFunc.toString = () => `function () {\n${funcBody}\n}`;
                if (!func) {
                    func = Function(funcBody) as TemplateFunction;
                    func.toString = () => funcBody;
                    if (options.cache !== false) {
                        templateCache.set(key, func);
                    }
                }
                try {
                    if (options.verbose) {
                        console.groupCollapsed(`(function () {`);
                        console.log(`${funcBody}})\n(`, ...(args as any[]).reduce((a, t) => {
                            if (a.length > 0) a.push(",");
                            a.push(typeof t === "string" ? `"${t}"` : t);
                            return a;
                        }, []), ")")
                        console.groupEnd();
                    }
                    const contextFunc = ((...args: unknown[]) => templateFunc(...args)) as ContextFunction<unknown>;
                    contextFunc[Symbol.iterator] = function* () {
                        yield* args;
                    };
                    for (let i = 0; i < args.length; i++) {
                        contextFunc[i] = args[i];
                    }
                    contextFunc.load = load;
                    contextFunc.escape = escape;
                    return iterateRecursively(func.apply(contextFunc));
                } catch (error: any) {
                    error.message += `\nat function () {\n${funcBody}\n})(${
                        args.map(t => typeof t === "string" ? `"${t}"` : t).join(", ")
                    })`;
                    throw error;
                }
            });
    return templateFunc;
}) as typeof Nostache;

(Nostache as { options: TemplateOptions }).options = {} as TemplateOptions;
(Nostache as { cache: TemplateCache }).cache = templateCache;

export default Nostache;