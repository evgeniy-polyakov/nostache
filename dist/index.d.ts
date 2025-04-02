declare const Nostache: {
    (template: string): ((...context: unknown[]) => Promise<string>) & {
        verbose: boolean;
    };
    verbose: boolean;
};
export default Nostache;
