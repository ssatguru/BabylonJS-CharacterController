var path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
var webpack = require("webpack");
const { BABYLONJS_ES6_MAP } = require("./webpack.es-externals");

module.exports = (env, argv) => {
  // UMD configuration (unchanged behavior)
  const umdConfig = {
    mode: "development",
    entry: "./src/CharacterController.ts",
    devtool: "source-map",
    devServer: {
      devMiddleware: {
        publicPath: "/dist/",
      },
      static: {
        directory: "./",
        serveIndex: true,
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: argv.mode === "production" ? "CharacterController.js" : "CharacterController.max.js",
      libraryTarget: "umd",
    },
    externals: {
      babylonjs: {
        commonjs: "babylonjs",
        commonjs2: "babylonjs",
        amd: "babylonjs",
        root: "BABYLON",
      },
    },
    optimization: {
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
            ecma: undefined,
            mangle: {
              // mangle options
              properties: {
                // mangle property options
                //mangle all variables starting with underscore "_"
                regex: /^_/,
              },
            },
          },
        }),
      ],
    },
  };

  // ESM configuration (new)
  // Build externals object: mark each @babylonjs/core sub-path as external
  const esmExternals = {};
  const uniqueSubPaths = [...new Set(Object.values(BABYLONJS_ES6_MAP))];
  for (const subPath of uniqueSubPaths) {
    esmExternals[subPath] = subPath;
  }

  const esmConfig = {
    mode: "production",
    entry: "./src/CharacterController.ts",
    devtool: "source-map",
    experiments: {
      outputModule: true,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                compilerOptions: {
                  declaration: false,
                },
              },
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      alias: {
        // Alias "babylonjs" so that webpack resolves it to a virtual module
        // that re-exports from @babylonjs/core sub-paths
        babylonjs: path.resolve(__dirname, "src", "_babylonjs-esm-bridge.js"),
      },
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "CharacterController.es.js",
      library: {
        type: "module",
      },
      module: true,
    },
    externalsType: "module",
    externals: esmExternals,
    optimization: {
      minimize: false,
    },
  };

  // Only include ESM config for production builds
  if (argv.mode === "production") {
    return [umdConfig, esmConfig];
  }

  return umdConfig;
};
