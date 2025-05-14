import { defineConfig } from 'tsup';

export default defineConfig(() => {
  return {
    entry: [
      './src/*.{ts,tsx}',
      './src/nextjs/index.ts',
    ],
    minify: false,
    clean: true,
    sourcemap: true,
    format: ['cjs', 'esm'],
    legacyOutput: true,
    dts: true,
  };
});