import sharedConfig from '@repo/shared-config/eslint.config.mjs';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'src/generated/**',
      'src/hooks/**',
      'src/hooks.ts',
      'scripts/**',
      'eslint.config.mjs',
    ],
  },
  ...sharedConfig,
];
