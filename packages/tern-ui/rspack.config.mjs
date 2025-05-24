// @ts-check
//const rspack = require('@rspack/core');
//const packageJSON = require('./package.json');
//const path = require('path');
//const { merge } = require('webpack-merge');
//const ReactRefreshPlugin = require('@rspack/plugin-react-refresh');
//const { RsdoctorRspackPlugin } = require('@rsdoctor/rspack-plugin');


import rspack from '@rspack/core';
import path from 'path';
import { fileURLToPath } from 'url';
import { merge } from 'webpack-merge';
import { createRequire } from 'module';
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';


const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const packageJSON = require('./package.json');

const APP_ENTRY_POINTS_CONFIG = {
  index: './src/index.ts',
  'index.browser': './src/index.browser.ts',
};

/**
 * @param {string} entryName
 * @returns {import('@rspack/core').Configuration}
 */
const entry = entryName => {
  return {
    entry: {
      [entryName]: APP_ENTRY_POINTS_CONFIG[entryName],
    },
  }
};

/**
 * @returns { import('@rspack/cli').Configuration }
 */
const sharedConfig = () => {
  return {
    resolve: {
      extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx'],
    },
    output: {
      chunkFilename: `[name]_index_[fullhash:6]_${packageJSON.version}.js`
    },
    plugins: [
      //new RsdoctorRspackPlugin({
      //  mode: process.env.RSDOCTOR === 'brief' ? 'brief' : 'normal',
      //  disableClientServer: process.env.RSDOCTOR === 'brief',
      //  supports: {
      //    generateTileGraph: true,
      //  }
      //})
    ],
    optimization: {
      splitChunks: {
        cacheGroups: {
          signIn: {
            minChunks: 1,
            name: 'SignIn',
            test: module => {
              if (module instanceof rspack.NormalModule) {
                return !!(module.resource && module.resource.includes('/ui/SignIn'));
              }
              return false;
            },
          },
          common: {
            minChunks: 1,
            name: 'ui-common',
            priority: -20,
            test: module => {
              if (module instanceof rspack.NormalModule) {
                return !!(module.resource && module.resource.includes('/ui/'));
              }
              return false;
            },
          },
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            minChunks: 1,
            priority: -10
          },
          react: {
            test: /[\\/]node_modules[\\/](react-dom|scheduler)[\\/]/,
            name: 'framework',
            chunks: 'all',
            priority: 40,
            enforce: true
          }
        }
      }
    },
    ignoreWarnings: [/entrypoint size limit/, /asset size limit/, /Rspack performance recommendations/],
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
/** @type { () => (import('@rspack/core').RuleSetRule[]) }  */
const typescriptLoader = () => {
  return [
    {
    test: /\.(jsx?|tsx?)$/,
    exclude: /node_modules/,
    use: {
      loader: 'builtin:swc-loader',
      options: {
        env: {
          targets: packageJSON.browserslist
        },
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true
          },
          externalHelpers: true,
          transform: {
            react: {
              runtime: 'automatic',
              development: false,
              refresh: false
            },
          },
        },
      },
    },
  },
  {
    test: /\.m?js$/,
    exclude: /node_modules[\\/]core-js/,
    use: {
      loader: 'builtin:swc-loader',
      options: {
        env: {
          targets: packageJSON.browserslist
        },
        isModule: 'unknown',
      },
    },
  },
];
};


/** @type { () => (import('@rspack/core').RuleSetRule[]) } */
const typescriptDevLoader = () => {
  return [
    {
      test: /\.(jsx?|tsx?)$/,
      exclude: /node_modules/,
      use: {
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            target: 'esnext',
            parser: {
              syntax: 'typescript',
              tsx: true
            },
            externalHelpers: true,
            transform: {
              react: {
                runtime: 'automatic',
                development: true,
                refresh: true
              },
            },
          },
        },
      },
    },
  ];
}

/**
 * @returns {{ module: { rules: import('@rspack/core').RuleSetRule[] }}}
 */
function prodBundler() {
  return {
    module: {
      rules: [
        cssLoader(),
        ...typescriptLoader()
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
    sharedConfig(),
    sharedProdConfig(),
    prodBundler(),
    {
      mode: 'production'
    }
  );

  const BrowserConfig = merge(baseProdConfig, {
    ...entry('index.browser'),
  });

  const EsmConfig = merge(baseProdConfig, {
    ...entry('index'),
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
    ...entry('index'),
    output: {
      filename: '[name].js',
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
    BrowserConfig,
    EsmConfig,
    CjsConfig
  ];
}
/**
 * @param {object} config.env
 * @returns
*/
const devConfig = ({ env }) => {
  const devUrl = new URL(env.devOrigin);

  /** @type {() => import('@rspack/core').Configuration} */
  const sharedDevConfig = () => {
    return {
      module: {
        rules: [
          cssLoader(),
          ...typescriptDevLoader()
        ]
      },
      plugins: [
        new ReactRefreshPlugin(/** @type {any} **/ ({ overlay: { sockHost: devUrl.host } })),
      ],
      devtool: 'eval-cheap-source-map',
      output: {
        publicPath: `${devUrl.origin}/npm`,
        crossOriginLoading: 'anonymous',
        filename: '[name].js',
        libraryTarget: 'umd',
        //globalObject: '(typeof self !== "undefined" ? self : this)' // confirm
      },
      optimization: {
        minimize: false,
      },
      devServer: {
        allowedHosts: ['all'],
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        host: '0.0.0.0',
        port: 4000,
        hot: true,
        static: ['dist'],
        liveReload: false,
        client:{
          webSocketURL: `auto://${devUrl.host}/ws`,
          logging: 'log',
        }
      },
      cache: true,
      experiments: {
         cache: {
           type: 'persistent',
         }
      }
    };
  };

  const configToMerge = merge(
    entry('index.browser'),
    sharedConfig(),
    sharedDevConfig(),
    {
      mode: 'development'
    }
  );

  const mergedConfig = configToMerge;

  return mergedConfig;
}

/**
 * @param {{ production?: boolean } | undefined} env
 */
const build = env => {
  const isProd = env && env.production;
  const config = isProd ? prodConfig() : devConfig({env});

  console.log('Current environment:', isProd ? 'production' : 'development');

  //console.log('Config:', JSON.stringify({
    //prod: prodConfig(),
   // dev: devConfig()
  //}, null, 2));

  if (isProd) {
    console.log('Production config:', JSON.stringify(config, null, 2));
  }
  else {
    console.log('Development config:', JSON.stringify(config, null, 2));
  }


  return config;
}

export default build;