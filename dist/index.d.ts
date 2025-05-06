type ContextFunction<TArgument, TExtensions extends Record<string, unknown> = Record<string, unknown>, TExtensionName extends keyof TExtensions = keyof TExtensions> = {
    (...args: TArgument[]): Promise<string>;
    [arg: number]: TArgument;
} & Iterable<TArgument> & {
    escape(value: unknown): Promise<string>;
    load(input: string | URL | Request, init?: RequestInit): TemplateFunction;
} & {
    [name in TExtensionName]: TExtensions[TExtensionName];
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
    extensions: Record<string, unknown>;
};
type TemplateCache = Map<string, TemplateFunction>;
declare const Nostache: {
    (template: string | Promise<string>, options?: TemplateOptions): TemplateFunction;
    readonly options: TemplateOptions;
    readonly cache: TemplateCache;
};
export default Nostache;
