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
      // WebXR requires a secure context; use `npm run dev:https` (which passes
      // `--server-type https`) so the origin is secure. webpack-dev-server
      // auto-generates a self-signed certificate, so no cert files are needed
      // (the browser shows a one-time warning to accept).
      //
      // Host is left at the default (localhost) so `--open` launches a friendly
      // https://localhost:8080 URL that browsers treat as a secure context.
      // To test on a real headset/phone over the LAN, run `npm run dev:https:lan`
      // which binds all interfaces (`--host 0.0.0.0`); then browse to
      // https://<this-machine-LAN-IP>:8080/tst/testXR.html from the device.
      allowedHosts: "all",
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
