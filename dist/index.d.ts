declare const Nostache: {
    (template: string): ((...context: unknown[]) => Promise<string>) & {
        verbose: boolean;
        toString(): string;
    };
    verbose: boolean;
};
export default Nostache;
