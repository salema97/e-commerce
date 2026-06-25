import sharedConfig from '@repo/shared-config/eslint.config.mjs';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'eslint.config.mjs',
      'postcss.config.mjs',
      'public/**',
      'e2e/**',
    ],
  },
  ...sharedConfig,
];
