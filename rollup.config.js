import typescript from '@rollup/plugin-typescript';
import terser from "@rollup/plugin-terser";

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/index.js',
            format: 'es',
            compact: true,
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
    plugins: [typescript()],
};