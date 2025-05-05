type TemplateFunction = (this: TemplateFunction & {
    escape(value: unknown): Promise<string>;
    load(input: string | URL | Request, init?: RequestInit): TemplateFunction;
}, ...context: any[]) => Promise<string>;
type TemplateOptions = {
    verbose?: boolean;
    async?: boolean;
    load?(input: string | URL | Request, init?: RequestInit): string | Promise<string>;
    escape?(value: string): string;
};
declare const Nostache: {
    (template: string | Promise<string>, options?: TemplateOptions): TemplateFunction;
    options: TemplateOptions;
};
export default Nostache;
