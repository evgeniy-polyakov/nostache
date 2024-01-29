declare function Nostache(template: string): (context?: unknown) => string & {
    verbose: boolean;
    contextDecomposition: boolean;
};
declare namespace Nostache {
    var verbose: boolean;
    var resultVariable: string;
    var contextDecomposition: boolean;
}
export default Nostache;
