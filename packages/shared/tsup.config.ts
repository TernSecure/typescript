import { defineConfig } from 'tsup';

export default defineConfig(() => {
  return {
    entry: [
      './src/*.{ts,tsx}',
      './src/nextjs/index.ts',
    ],
    bundle: true,
    minify: false,
    clean: true,
    sourcemap: true,
    format: ['cjs', 'esm'],
    platform: 'browser',
    dts: true,
    external: [
      'firebase',
      '@tern-secure/next-types'
    ]
  };
});