module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', [72]],
    'footer-leading-blank': [0],
  },
};
