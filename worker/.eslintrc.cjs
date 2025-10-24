module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
    worker: true,
  },
  extends: ['eslint:recommended'],
  ignorePatterns: ['dist', '.eslintrc.cjs', '.wrangler'],
  parser: '@typescript-eslint/parser',
  plugins: [],
  rules: {
    'no-unused-vars': 'off', // TypeScript handles this
    'no-undef': 'off', // TypeScript handles this
  },
  globals: {
    ExecutionContext: 'readonly',
  },
};
