const getBaseConfig = require('../../webpack.production.config');

module.exports = {
  ...getBaseConfig(__dirname),
};
