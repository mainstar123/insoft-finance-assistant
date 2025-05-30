// @ts-check
import eslintConfig from '../../eslint.config.js';

export default [
  ...eslintConfig,
  {
    files: ['**/*.ts'],
    plugins: ['@typescript-eslint', 'import'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal'],
          newlinesBetween: 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      '@nestjs/no-duplicate-decorator': 'error',
      '@nestjs/use-validation-pipe': 'error',
      '@nestjs/controllers-should-supply-api-tags': 'warn',
    },
  },
];
