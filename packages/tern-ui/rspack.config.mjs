// @ts-check
import rspack from '@rspack/core';
import path from 'path';
import { fileURLToPath } from 'url';
import { merge } from 'webpack-merge';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

/**
 *
 * @returns {import('@rspack/core').Configuration}
 */
const entry = () => ({
  entry: {
    index: './src/index.ts'
  },
})

/**
 *  @returns { import('@rspack/cli').Configuration }
 */
function sharedConfig() {
  return {
    resolve: {
      extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx'],
    },
    externals: {
      react: 'react',
      'react-dom': 'react-dom',
      '@tanstack/react-form': '@tanstack/react-form',
      '@tern-secure/types': '@tern-secure/types'
    },
  };
}

/**
 * @returns {import('@rspack/core').RuleSetRule}
 */
function cssLoader() {
  return {
    test: /\.css$/,
    use: ['postcss-loader'],
    type: 'css'
  };
}

// TypeScript Loader
/**
 * @returns {import('@rspack/core').RuleSetRule}
 */
function typescriptLoader() {
  return {
    test: /\.(ts|tsx)$/,
    exclude: /node_modules/,
    use: {
      loader: 'builtin:swc-loader',
      options: {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true
          },
          externalHelpers: true,
          transform: {
            react: {
              runtime: 'automatic'
            }
          }
        }
      }
    }
  };
}

/**
 * @returns {{ module: { rules: import('@rspack/core').RuleSetRule[] }}}
 */
function prodBundler() {
  return {
    module: {
      rules: [
        cssLoader(),
        typescriptLoader()
      ]
    }
  };
}

/** @type { () => (import('@rspack/core').Configuration) } */
const sharedProdConfig = () =>{
  return {
    devtool: false,
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      libraryTarget: 'umd',
      globalObject: 'globalThis',
    },
    optimization: {
      minimize: true,
      minimizer: [
        new rspack.SwcJsMinimizerRspackPlugin({
          minimizerOptions: {
            compress: {
              unused: true,
              dead_code: true,
              passes: 2,
            },
            mangle: {
              safari10: true,
            },
          },
        }),
      ],
    },
    plugins: [],
    resolve: {
      alias: {
        'core-js': path.dirname(require.resolve('core-js/package.json')),
      }
    }
  };
}

// Prod Config
/**
 * @returns {import('@rspack/core').Configuration[]}
 */
function prodConfig() {
  const baseProdConfig = merge(
    entry(),
    sharedConfig(),
    sharedProdConfig(),
    prodBundler(),
    {
      mode: 'production',
    }
  );

  const EsmConfig = merge(baseProdConfig, {
    experiments: {
      outputModule: true,
    },
    output: {
      filename: '[name].mjs',
      libraryTarget: 'module',
    },
    plugins: [
      new rspack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
    ],
    optimization: {
      splitChunks: false,
    },
  });

  const CjsConfig = merge(baseProdConfig, {
    output: {
      filename: '[name].cjs',
      libraryTarget: 'commonjs',
    },
    plugins: [
      new rspack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
    ],
    optimization: {
      splitChunks: false,
    },
  });

  return [
    EsmConfig,
    CjsConfig
  ];
}

/**
 * @returns {import('@rspack/core').Configuration}
 */
function devConfig() {
  /**
   * @returns {Partial<import('@rspack/core').Configuration>}
   */
  const sharedDevConfig = () => {
    return {
      module: {
        rules: [
          cssLoader(),
          typescriptLoader()
        ]
      },
      devtool: 'eval-cheap-source-map',
      optimization: {
        minimize: false,
      },
      cache: true,
      experiments: {
        // cache: {
        //   type: 'persistent',
        // }
      }
    };
  };
  return {
    ...sharedConfig(),
    ...sharedDevConfig(),
    mode: 'development',
    output: {
      //path: path.resolve(PACKAGE_ROOT, 'dist'),
      filename: '[name].js',
      clean: true,
    }
  };
}

/**
 * @param {{ production?: boolean } | undefined} env
 * @returns {import('@rspack/core').Configuration | import('@rspack/core').Configuration[]}
 */
const build = env => {
  const isProd = env && env.production;
  return isProd ? prodConfig() : devConfig();
}
console.log(JSON.stringify(prodConfig(), null, 2));
export default build;