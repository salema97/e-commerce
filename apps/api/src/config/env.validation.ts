import { z } from 'zod';
import { envCoreSchema } from './env.core.schema.js';
import { envProvidersSchema } from './env.providers.schema.js';

const envSchema = envCoreSchema.merge(envProvidersSchema).superRefine((data, ctx) => {
  if (data.APP_ENV === 'production' && data.ENABLE_TEST_AUTH === 'true') {
    ctx.addIssue({
      code: 'custom',
      path: ['ENABLE_TEST_AUTH'],
      message: 'ENABLE_TEST_AUTH cannot be true when APP_ENV is production',
    });
  }

  if (data.APP_ENV === 'production' && data.E2E_RELAX_THROTTLE === 'true') {
    ctx.addIssue({
      code: 'custom',
      path: ['E2E_RELAX_THROTTLE'],
      message: 'E2E_RELAX_THROTTLE cannot be true when APP_ENV is production',
    });
  }
});

export type Env = z.infer<typeof envSchema>;

const SRI_REQUIRED_KEYS = [
  'SRI_RUC',
  'SRI_DIGITAL_CERTIFICATE_PATH',
  'SRI_DIGITAL_CERTIFICATE_PASSWORD',
  'SRI_ESTABLISHMENT_CODE',
  'SRI_EMISSION_POINT_CODE',
] as const;

export function validate(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Environment validation failed: ${issues}`);
  }

  const data = result.data;
  const isProduction = data.APP_ENV === 'production';

  if (isProduction) {
    if (data.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      throw new Error(
        'Environment validation failed: STRIPE_SECRET_KEY must be a live key (sk_live_*) when APP_ENV is production',
      );
    }

    if (data.SRI_MODE === 'direct') {
      for (const key of SRI_REQUIRED_KEYS) {
        const value = data[key as keyof Env];
        if (typeof value !== 'string' || value.trim() === '') {
          throw new Error(
            `Environment validation failed: ${key} is required when APP_ENV is production and SRI_MODE is direct`,
          );
        }
      }

      if (data.SRI_TEST_ENVIRONMENT === 'true') {
        throw new Error(
          'Environment validation failed: SRI_TEST_ENVIRONMENT must be false when APP_ENV is production',
        );
      }
    }
  }

  if (data.APP_ENV === 'staging' || isProduction) {
    if (data.ENABLE_TEST_AUTH === 'true') {
      console.warn('WARNING: ENABLE_TEST_AUTH is enabled in a non-development environment');
    }
    if (data.E2E_RELAX_THROTTLE === 'true') {
      console.warn('WARNING: E2E_RELAX_THROTTLE is enabled in a non-development environment');
    }
    if (data.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      console.warn('WARNING: STRIPE_SECRET_KEY appears to be a test key in a non-development environment');
    }
    if (data.SRI_MODE === 'direct') {
      for (const key of SRI_REQUIRED_KEYS) {
        const value = data[key as keyof Env];
        if (typeof value !== 'string' || value.trim() === '') {
          console.warn(`WARNING: ${key} is empty; SRI direct integration will fail in production`);
        }
      }
    }
  }

  return data;
}
