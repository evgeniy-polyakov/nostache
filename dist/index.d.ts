type TemplateFunction = (this: TemplateFunction & {
    escape(value: unknown): Promise<string>;
    load(input: string | URL | Request, init?: RequestInit): Promise<TemplateFunction>;
}, ...context: any[]) => Promise<string>;
type TemplateOptions = {
    async?: boolean;
};
declare const Nostache: {
    (template: string | Promise<string>, options?: TemplateOptions): TemplateFunction;
    verbose: boolean;
    load: (input: string | URL | Request, init?: RequestInit) => TemplateFunction;
    escape: (value: unknown) => Promise<string>;
};
export default Nostache;
