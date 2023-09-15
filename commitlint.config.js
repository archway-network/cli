module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [
      'core',
      'new',
      'accounts',
      'config',
      'contracts',
      'rewards',
      'plugins',
      'ui'
    ]],
    'scope-case': [2, 'always', 'kebab-case'],
  },
};
