module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [
      // This list should be kept in sync with the
      // PR Lint workflow at .github/workflows/pr-lint.yml
      'deps',
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
