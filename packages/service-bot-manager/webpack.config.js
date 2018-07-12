var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var nodeExternals = require('webpack-node-externals');
var TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  entry: ['./service-bot-manager/src/index.ts'],
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'index.js',
    pathinfo: true,
  },
  target: 'node',
  context: path.resolve(__dirname, '../'),
  // externals: [
  // nodeExternals({
  //     whitelist: /^@overmindbots\/.*/,
  //   }),
  // ],
  mode: 'none',
  plugins: [
    new webpack.BannerPlugin({
      banner: 'require("source-map-support").install();',
      raw: true,
      entryOnly: false,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        // include: includePaths,
        loader: 'ts-loader',
        options: {
          // disable type checker - we will use it in fork plugin
          transpileOnly: true,
        },
      },
      {
        // Include ts, tsx, and js files.
        test: /\.(js)$/,
        // exclude: /node_modules\/(?![@overmindbots/shared-modules|@overmindbots/shared-utils])/,
        loader: 'babel-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      '@overmindbots/shared-models': path.resolve(
        __dirname,
        './node_modules/@overmindbots/shared-models/src'
      ),
      '@overmindbots/shared-utils': path.resolve(
        __dirname,
        './node_modules/@overmindbots/shared-utils/src'
      ),
    },
    // symlinks: false,
    plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.build.json' })],
  },
  stats: {
    // suppress "export not found" warnings about re-exported types
    warningsFilter: /export .* was not found in/,
  },
  devtool: 'sourcemap',
};
