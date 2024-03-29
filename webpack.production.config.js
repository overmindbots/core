const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const getBaseConfig = dirname => ({
  entry: ['./src/index.ts'],
  output: {
    path: path.join(dirname, 'production-build'),
    filename: 'index.js',
  },
  target: 'node',
  context: path.resolve(dirname),
  externals: [
    nodeExternals({
      whitelist: /^@overmindbots\/.*/,
    }),
  ],
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
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    // TODO: Make this dynamic
    alias: {
      '@overmindbots/shared-models': path.resolve(
        dirname,
        './node_modules/@overmindbots/shared-models/src'
      ),
      '@overmindbots/shared-utils': path.resolve(
        dirname,
        './node_modules/@overmindbots/shared-utils/src'
      ),
      '@overmindbots/discord.js-command-manager': path.resolve(
        dirname,
        './node_modules/@overmindbots/discord.js-command-manager/src'
      ),
    },
    plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.build.json' })],
  },
  stats: {
    // suppress "export not found" warnings about re-exported types
    warningsFilter: /(export .* was not found in)|(Critical dependency: the request of a dependency is an expression)/,
  },
  devtool: 'sourcemap',
});

module.exports = getBaseConfig;
