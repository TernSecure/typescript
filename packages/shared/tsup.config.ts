import { defineConfig } from 'tsup';
import { version as ternUiVersion } from '../tern-ui/package.json';
import { name, version } from './package.json';

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
      'react',
      'react-dom'
    ],
    define: {
      PACKAGE_NAME: `"${name}"`,
      PACKAGE_VERSION: `"${version}"`,
      TERN_UI_VERSION: `"${ternUiVersion}"`,
    },
  };
});