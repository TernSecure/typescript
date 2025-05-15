import { defineConfig } from 'tsup';

export default defineConfig(() => {
  return {
    entry: [
      './src/**/*.{ts,tsx,js,jsx}',
      './src/styles/globals.css',
    ],
    bundle: false,
    minify: false,
    clean: true,
    sourcemap: true,
    format: ['cjs', 'esm'],
    dts: true,
    external: [
    'react',
    'react-dom',
    'next',
    'firebase',
    '@tern-secure/types',
    '@tanstack/react-form',
    '@tern-secure/next-backend',
    'tailwindcss'
  ],
  loader: {
    '.css': 'local-css'
  },
  onSuccess: 'pnpm build:styles',
  };
});