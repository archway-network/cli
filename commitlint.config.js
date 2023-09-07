module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['accounts', 'config', 'contracts', 'new', 'plugins', 'rewards', 'ui']],
    'scope-case': [2, 'always', 'kebab-case'],
  },
};
