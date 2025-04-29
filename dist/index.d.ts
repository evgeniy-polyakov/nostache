declare const Nostache: {
    (template: string): ((...context: any[]) => Promise<string>) & {
        verbose: boolean;
        toString(): string;
        escape(value: unknown): Promise<string>;
    };
    verbose: boolean;
    escape: (value: unknown) => Promise<string>;
};
export default Nostache;
