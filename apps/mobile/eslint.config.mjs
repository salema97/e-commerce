import sharedConfig from '@repo/shared-config/eslint.config.mjs';

export default [
  {
    name: 'mobile/ignores',
    ignores: [
      'android/**',
      'ios/**',
      '.expo/**',
      'dist/**',
      'build/**',
      '**/*.config.{ts,js,mjs}',
      'scripts/**',
      'plugins/**',
    ],
  },
  ...sharedConfig,
];
