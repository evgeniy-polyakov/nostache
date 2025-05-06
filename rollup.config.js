import typescript from '@rollup/plugin-typescript';
import terser from "@rollup/plugin-terser";
import replace from "@rollup/plugin-replace";

const replacements = {
    WHITESPACE: " ".charCodeAt(0),
    TAB: "\t".charCodeAt(0),
    RETURN: "\r".charCodeAt(0),
    NEWLINE: "\n".charCodeAt(0),
    UNDERSCORE: "_".charCodeAt(0),
    LOWERCASE_A: "a".charCodeAt(0),
    LOWERCASE_Z: "z".charCodeAt(0),
    UPPERCASE_A: "A".charCodeAt(0),
    UPPERCASE_Z: "Z".charCodeAt(0),
    NUMBER_0: "0".charCodeAt(0),
    NUMBER_9: "9".charCodeAt(0),
    OPEN_ANGLE: "<".charCodeAt(0),
    CLOSE_ANGLE: ">".charCodeAt(0),
    OPEN_BRACE: "{".charCodeAt(0),
    CLOSE_BRACE: "}".charCodeAt(0),
    OPEN_PARENTHESES: "(".charCodeAt(0),
    CLOSE_PARENTHESES: ")".charCodeAt(0),
    ASSIGN: "=".charCodeAt(0),
    TILDE: "~".charCodeAt(0),
    SLASH: "/".charCodeAt(0),
    ASTERISK: "*".charCodeAt(0),
    BACKSLASH: "\\".charCodeAt(0),
    APOSTROPHE: "'".charCodeAt(0),
    QUOTE: "\"".charCodeAt(0),
    BACKTICK: "`".charCodeAt(0),
    DOLLAR: "$".charCodeAt(0),
    AT_SIGN: "@".charCodeAt(0),
};

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/nostache.mjs',
            format: 'es',
            compact: true,
            sourcemap: true,
        },
        {
            name: 'Nostache',
            file: 'dist/nostache.js',
            format: 'umd',
            compact: true,
            sourcemap: true,
        },
        {
            name: 'Nostache',
            file: 'dist/nostache.min.js',
            format: 'umd',
            compact: true,
            sourcemap: true,
            plugins: [terser()],
        }
    ],
    plugins: [
        replace({
            preventAssignment: true,
            ...replacements
        }),
        typescript()
    ],
};