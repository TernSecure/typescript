import { defineConfig } from 'tsup';

export default defineConfig(() => {
  return {
    entry: [
      './src/**/*.{ts,tsx,js,jsx}'
    ],
    bundle: false,
    minify: true,
    clean: true,
    sourcemap: true,
    format: ['cjs', 'esm'],
    dts: true,
    external: [
    'react',
    'react-dom',
    'next',
    'firebase',
    'firebase-admin',
    '@tern-secure/types',
    '@tanstack/react-form',
    '@tern-secure/next-backend',
    '@tern-secure/shared',
    'tailwindcss',
    'firebase/auth',
    'firebase/storage',
    'firebase/firestore'
  ],
  injectStyle: true,
  //onSuccess: 'pnpm build:styles'
  };
});