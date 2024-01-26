declare function Nostache(template: string): (context?: unknown) => string & {
    verbose: boolean;
};
declare namespace Nostache {
    var verbose: boolean;
    var resultVariable: string;
}
export default Nostache;
