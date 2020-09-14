module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  root: true,
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', {
      'vars': 'local',
      'args': 'after-used',
      'ignoreRestSiblings': false,
      'argsIgnorePattern': '^_',
    }],
    'arrow-parens': ['error', 'always'],
    // must expand out comma-dangle to get `functions` option enabled
    'comma-dangle': ['error', {
      'arrays': 'always-multiline',
      'objects': 'always-multiline',
      'imports': 'always-multiline',
      'exports': 'always-multiline',
      'functions': 'always-multiline',
    }],
    'indent': ['error', 2, { 'SwitchCase': 1 }],
    'linebreak-style': ['error', 'unix'],
    'max-len': ['error', { 'code': 120, 'tabWidth': 2, 'ignoreComments': true }],
    'no-duplicate-imports': 'error',
    'no-empty': ['error', { 'allowEmptyCatch': true }],
    'no-multi-spaces': 'error',
    'no-multiple-empty-lines': ['error', {'max': 1}],
    'no-unused-vars': ['warn', {
      'vars': 'local',
      'args': 'after-used',
      'ignoreRestSiblings': false,
      'argsIgnorePattern': '^_',
    }],
    'quotes': ['error', 'single'],
    'semi':['error', 'always'],
    'spaced-comment': ['error', 'always'],
  },
};
