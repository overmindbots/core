module.exports = {
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testMatch: ['**/test/*.+(ts|tsx|js)'],
  testPathIgnorePatterns: ['/node_modules/', 'setupTests.ts'],
  moduleFileExtensions: ['ts', 'js', 'node'],
  moduleNameMapper: {
    '~/(.+)': '<rootDir>/src/$1',
    '@overmindbots/shared-utils(.+)':
      '<rootDir>/node_modules/@overmindbots/shared-utils/src/$1',
    '@overmindbots/shared-models(.+)':
      '<rootDir>/node_modules/@overmindbots/shared-models/src/$1',
    '@overmindbots/discord.js-command-manager(.+)':
      '<rootDir>/node_modules/@overmindbots/discord.js-command-manager/src/$1',
  },
};
