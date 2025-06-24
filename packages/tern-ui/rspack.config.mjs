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
  ternsecure: './src/index.ts',
  'ternsecure.browser': './src/index.browser.ts',
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
    plugins: [
      //new RsdoctorRspackPlugin({
      //  mode: process.env.RSDOCTOR === 'brief' ? 'brief' : 'normal',
      //  disableClientServer: process.env.RSDOCTOR === 'brief',
      //  supports: {
      //    generateTileGraph: true,
      //  }
      //})
    ],
    output: {
      chunkFilename: `[name]_ternsecure_[fullhash:6]_${packageJSON.version}.js`
    },
    externals: undefined,
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

/** @type { () => (import('@rspack/core').RuleSetRule) }  */
const svgLoader = () => {
  return {
    test: /\.svg$/,
    resolve: {
      fullySpecified: false,
    },
    use: {
      loader: '@svgr/webpack',
      options: {
        svgo: true,
        svgoConfig: {
          floatPrecision: 3,
          transformPrecision: 1,
          plugins: ['preset-default', 'removeDimensions', 'removeStyleElement'],
        },
      },
    },
  };
};

/** @type { () => (import('@rspack/core').RuleSetRule) }  */
const cssLoader = () => {
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
  ];
}

/** @type { () => (import('@rspack/core').Configuration) } */
const prodBundler = () => {
  return {
    module: {
      rules: [
        svgLoader(),
        cssLoader(),
        ...typescriptLoader()
      ]
    }
  };
}

/** @type { () => (import('@rspack/core').Configuration) } */
const sharedProdConfig = () => {
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
        new rspack.LightningCssMinimizerRspackPlugin(),
      ],
    },
    plugins: [],
    resolve: {
      alias: {
        'core-js': path.dirname(require.resolve('core-js/package.json')),
      }
    },
    experiments : {
      css: true
    }
  };
}

// Prod Config
/**
 * @returns {import('@rspack/core').Configuration[]}
 */
const prodConfig = () => {
  const baseProdConfig = merge(
    sharedConfig(),
    sharedProdConfig(),
    prodBundler(),
    {
      mode: 'production'
    }
  );

  const BrowserConfig = merge(
    entry('ternsecure.browser'),
    sharedConfig(),
    sharedProdConfig(),
    prodBundler(),
    {
      mode: 'production'
    }
  );

  const EsmConfig = merge(baseProdConfig, {
    ...entry('ternsecure'),
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
    ...entry('ternsecure'),
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
 * @param {object} config
 * @param {object} config.env
 * @returns
*/
const devConfig = ({ env }) => {
  const devOriginFromEnv = env.devOrigin || 'http://localhost:4000';
  const devUrl = new URL(devOriginFromEnv);
  const isTest = env.test

  /** @type {() => import('@rspack/core').Configuration} */
  const sharedDevConfig = () => {
    return {
      module: {
        rules: [
          svgLoader(),
          cssLoader(),
          ...typescriptDevLoader()
        ]
      },
      plugins: [
        new ReactRefreshPlugin(/** @type {any} **/ ({ overlay: { sockHost: devUrl.host } })), 
          isTest && new rspack.HtmlRspackPlugin({
            minify: false,
            template:'./public/index.html',
            inject: false
          })
      ],
      devtool: 'eval-cheap-source-map',
      output: {
        //path: path.resolve(__dirname, 'dist'),
        //publicPath: env.devOrigin ? `${devUrl.origin}` : '/cdn/',
        crossOriginLoading: 'anonymous',
        filename: '[name].js',
        libraryTarget: 'umd',
        //globalObject: 'globalThis',
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
        liveReload: false,
        client:{
          webSocketURL: `auto://${devUrl.host}/ws`,
        }
      },
      cache: true,
      experiments: {
        css: true,
         cache: {
           type: 'persistent',
         }
      }
    };
  };

  const configToMerge = merge(
    entry('ternsecure.browser'),
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

  //if (isProd) {
  //  console.log('Config for production build:', JSON.stringify(config, null, 2));
  //}
  //else {
  //  console.log('Config for development build:', JSON.stringify(config, null, 2));
  //}


  return config;
}

export default build;