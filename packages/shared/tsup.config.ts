import { defineConfig } from 'tsup';

export default defineConfig(() => {
  return {
    entry: [
      './src/*.{ts,tsx}',
      './src/react/index.ts',
    ],
    bundle: true,
    minify: false,
    clean: true,
    sourcemap: true,
    format: ['cjs', 'esm'],
    dts: true,
    external: [
      '@tern-secure/types'
    ]
  };
});