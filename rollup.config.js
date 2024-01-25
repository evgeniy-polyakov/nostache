import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/index.ts',
    output: {
        name: 'nostache',
        file: 'dist/nostache.js',
        format: 'umd',
        compact: true,
    },
    plugins: [typescript()],
};