export type ContextFunction<TArgument, TExtensions extends Record<string, unknown> = Record<string, unknown>, TExtensionName extends keyof TExtensions = keyof TExtensions> = {
    (this: ContextFunction<TArgument, TExtensions, TExtensionName>, ...args: TArgument[]): Promise<string>;
    [arg: number]: TArgument;
} & Iterable<TArgument> & {
    escape(value: unknown): Promise<string>;
    import(value: string): TemplateFunction;
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
declare const Nostache: {
    (template: string | Promise<string>, options?: TemplateOptions): TemplateFunction;
    readonly options: TemplateOptions;
    readonly cache: TemplateCache;
};
export default Nostache;
