type TemplateFunction = ((...context: any[]) => Promise<string>) & {
    verbose: boolean;
    toString(): string;
    escapeHtml(value: unknown): Promise<string>;
    fetch(input: string | URL | Request, init?: RequestInit): Promise<TemplateFunction>;
};
declare const Nostache: {
    (template: string): TemplateFunction;
    verbose: boolean;
    fetch: (input: string | URL | Request, init?: RequestInit) => Promise<TemplateFunction>;
    escapeHtml: (value: unknown) => Promise<string>;
};
export default Nostache;
