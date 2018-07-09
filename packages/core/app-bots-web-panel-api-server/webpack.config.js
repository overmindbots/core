var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const baseConfig = {
  target: 'node',
  context: __dirname,
  externals: [nodeExternals()],
  mode: 'none',
  plugins: [
    new webpack.IgnorePlugin(/\.(css|less)$/),
    new webpack.BannerPlugin({
      banner: 'require("source-map-support").install();',
      raw: true,
      entryOnly: false,
    }),
  ],
  module: {
    rules: [
      {
        // Include ts, tsx, and js files.
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          // disable type checker - we will use it in fork plugin
          transpileOnly: true,
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  stats: {
    // suppress "export not found" warnings about re-exported types
    warningsFilter: /export .* was not found in/,
  },
  devtool: 'sourcemap',
};

const appConfig = Object.assign({}, baseConfig, {
  entry: ['@babel/polyfill', './src/index.ts'],
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'server.js',
  },
});

const syncSchemaConfig = Object.assign({}, baseConfig, {
  entry: ['@babel/polyfill', './src/scripts/syncSchema.ts'],
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'syncSchema.js',
  },
});

module.exports = [appConfig, syncSchemaConfig];
