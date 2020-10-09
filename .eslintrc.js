module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'eslint-config-begin',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': [ 'warn', {
      vars: 'local',
      args: 'after-used',
      ignoreRestSiblings: false,
      argsIgnorePattern: '^_',
    } ],
    'max-len': [ 'error', { code: 120, tabWidth: 2, ignoreComments: true } ],
    'no-unused-vars': [ 'warn', {
      vars: 'local',
      args: 'after-used',
      ignoreRestSiblings: false,
      argsIgnorePattern: '^_',
    } ],
  },
};