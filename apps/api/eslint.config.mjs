import sharedConfig from '@repo/shared-config/eslint.config.mjs';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'prisma/**',
      'test/**',
      'eslint.config.mjs',
    ],
  },
  ...sharedConfig,
];
