module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  overrides: [
    {
      files: ['*.json'],
      parser: 'eslint-plugin-json',
    },
  ],
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    // eslint-plugin-prettier - runs prettier as eslint rule
    'plugin:prettier/recommended',
    // eslint-config-prettier - has to be last to disable conflicting rules
    'prettier',
  ],
  env: {
    es2022: true,
    node: true,
  },
  ignorePatterns: [
    '**/.eslintrc.cjs',
    '**/*.config.js',
    '**/*.config.cjs',
    '**/*.config.mjs',
    '.sst',
    '.next',
    'dist',
    'node_modules',
    'package-lock.json',
    'pnpm-lock.yaml',
    '**/*.tsbuildinfo',
    'generate-dot-env.js',
    '**/*.mjs',
  ],
  reportUnusedDisableDirectives: true,
  rules: {
    '@typescript-eslint/no-confusing-void-expression': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'prettier/prettier': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'warn',
      {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
      },
    ],
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        multiline: {
          delimiter: 'none',
          requireLast: true,
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false,
        },
      },
    ],
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksVoidReturn: {
          attributes: false,
        },
      },
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector: "MemberExpression[object.name='JSON'][property.name='parse']",
        message: 'Use safeSchemaJsonParse instead of JSON.parse',
      },
    ],
  },
}
