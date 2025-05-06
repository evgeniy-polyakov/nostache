type ContextFunction<TArg> = Iterable<TArg> & {
    (...args: TArg[]): Promise<string>;
    [arg: number]: TArg;
    escape(value: unknown): Promise<string>;
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
declare const Nostache: {
    (template: string | Promise<string>, options?: TemplateOptions): TemplateFunction;
    readonly options: TemplateOptions;
    readonly cache: TemplateCache;
};
export default Nostache;
