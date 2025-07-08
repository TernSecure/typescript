import { defineConfig } from 'tsup'
import type { Options } from 'tsup'
import { name, version } from './package.json'

const config: Options = {
    entry: ['./src/**/*.{ts,tsx,js,jsx}'],
    bundle: false,
    sourcemap: true,
    clean: true,
    minify: false,
    legacyOutput: true,
    external: [
        'react',
        'react-dom'
    ], 
    define: {
        PACKAGE_NAME: `"${name}"`,
        PACKAGE_VERSION: `"${version}"`,
    },
};

const esmConfig: Options = {
    ...config,
    format: 'esm'
};

const cjsConfig: Options = {
    ...config,
    format: 'cjs',
    outDir: './dist/cjs'
};

export default defineConfig([
    esmConfig,
    cjsConfig,
]);