const getBaseConfig = require('../../webpack.production.config');

console.log(getBaseConfig);

module.exports = {
  ...getBaseConfig(__dirname),
};
