import type { Config } from 'tailwindcss';
import sharedConfig from '@repo/shared-config/tailwind.config.ts';

export default {
  ...sharedConfig,
  content: [
    '../../packages/shared-ui/src/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
} satisfies Config;
