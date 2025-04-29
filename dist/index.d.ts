type TemplateFunction = ((...context: any[]) => Promise<string>) & {
    verbose: boolean;
    toString(): string;
    escapeHtml(value: unknown): Promise<string>;
};
declare const Nostache: {
    (template: string): TemplateFunction;
    verbose: boolean;
    escapeHtml: (value: unknown) => Promise<string>;
};
export default Nostache;
