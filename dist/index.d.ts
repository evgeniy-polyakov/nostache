type TemplateFunction = (this: TemplateFunction & {
    escapeHtml(value: unknown): Promise<string>;
    fetch(input: string | URL | Request, init?: RequestInit): Promise<TemplateFunction>;
}, ...context: any[]) => Promise<string>;
type TemplateOptions = {
    async?: boolean;
};
declare const Nostache: {
    (template: string | Promise<string>, options?: TemplateOptions): TemplateFunction;
    verbose: boolean;
    fetch: (input: string | URL | Request, init?: RequestInit) => TemplateFunction;
    escapeHtml: (value: unknown) => Promise<string>;
};
export default Nostache;
