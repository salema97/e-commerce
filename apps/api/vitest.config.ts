import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    pool: 'forks',
    ...(process.env.CI ? { forbidOnly: true } : {}),
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
