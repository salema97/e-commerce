import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharedConfig from '@repo/shared-config/eslint.config.mjs';

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'prisma/**',
      'prisma.config.ts',
      'test/**',
      '**/*.spec.ts',
      'vitest.config.ts',
      'vitest.config.e2e.ts',
      'scripts/**',
      'eslint.config.mjs',
    ],
  },
  ...sharedConfig,
  {
    name: 'api/typescript-project',
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './tsconfig.json',
        tsconfigRootDir,
      },
    },
  },
];
