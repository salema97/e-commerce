import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_SUCCESS_URL: z.string().min(1),
  STRIPE_CANCEL_URL: z.string().min(1),
  SRI_MODE: z.enum(['direct', 'intermediary']).default('direct'),
  SRI_RUC: z.string().min(1),
  SRI_SOL_KEY: z.string().min(1),
  SRI_DIGITAL_CERTIFICATE_PATH: z.string().min(1),
  SRI_DIGITAL_CERTIFICATE_PASSWORD: z.string().min(1),
  SRI_ESTABLISHMENT_CODE: z.string().min(1),
  SRI_EMISSION_POINT_CODE: z.string().min(1),
  SRI_TEST_ENVIRONMENT: z.enum(['true', 'false']).default('true'),
});

export type Env = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Environment validation failed: ${issues}`);
  }

  return result.data;
}
