import { defineConfig } from 'tsup';
import type { Options } from 'tsup';

const config: Options = {
  entry: ['./src/**/*.{ts,tsx,js,jsx}'],
  bundle: false,
  sourcemap: true,
  clean: true,
  minify: false,
  dts: false,
  legacyOutput: true,
  external: [
    'react',
    'react-dom',
    'next',
    'firebase',
    '@tern-secure/types',
    '@tern-secure/next-backend',
    'tailwindcss'
  ]
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