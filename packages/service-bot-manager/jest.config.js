const baseConfig = require('../../jest.base');

module.exports = {
  ...baseConfig,
  setupTestFrameworkScriptFile: '<rootDir>/test/setupTests.ts',
};
