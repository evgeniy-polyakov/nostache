declare function Nostache(template: string): ((...context: unknown[]) => Promise<string>) & {
    verbose: boolean;
};
declare namespace Nostache {
    var verbose: boolean;
}
export default Nostache;
