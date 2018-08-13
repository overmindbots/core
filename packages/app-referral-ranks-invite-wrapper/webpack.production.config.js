const getBaseConfig = require('../../webpack.production.config');

const baseConfig = getBaseConfig(__dirname);

module.exports = {
  ...baseConfig,
  module: {
    ...baseConfig.module,
    rules: [
      ...baseConfig.module.rules,
      { test: /\.handlebars$/, loader: 'handlebars-loader' },
    ],
  },
};
