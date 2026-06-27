import { z } from 'zod';

/** Required variables for API boot — database, cache, auth, and runtime flags. */
export const envCoreSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  AUTH_JWT_ACCESS_SECRET: z.string().min(32),
  AUTH_ACCESS_TOKEN_TTL: z.string().default('15m'),
  AUTH_REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(30),
  ENABLE_TEST_AUTH: z.enum(['true', 'false']).default('false'),
  E2E_RELAX_THROTTLE: z.enum(['true', 'false']).default('false'),
  CAPTCHA_PROVIDER: z.enum(['none', 'hcaptcha']).default('none'),
  HCAPTCHA_SECRET_KEY: z.string().optional(),
});
