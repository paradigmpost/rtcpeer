module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', {
      'vars': 'local',
      'args': 'after-used',
      'ignoreRestSiblings': false,
      'argsIgnorePattern': '^_'
    }],
    // must expand out comma-dangle to get `functions` option enabled
    'comma-dangle': ['error', {
      'arrays': 'always-multiline',
      'objects': 'always-multiline',
      'imports': 'always-multiline',
      'exports': 'always-multiline',
      'functions': 'always-multiline',
    }],
    'indent': ['error', 2],
    'no-multi-spaces': 'error',
    'no-multiple-empty-lines': ['error', {
      'max': 1,
    }],
    'max-len': ['error', { 'code': 120, 'tabWidth': 2, 'ignoreComments': true }],
    'no-duplicate-imports': 'error',
    'no-empty': ['error', { 'allowEmptyCatch': true }],
    'no-unused-vars': ['warn', {
      'vars': 'local',
      'args': 'after-used',
      'ignoreRestSiblings': false,
      'argsIgnorePattern': '^_'
    }],
    'semi':[2, 'always'],
    'spaced-comment': ['error', 'always'],
    'quotes': ['error', 'single'],
  },
};
