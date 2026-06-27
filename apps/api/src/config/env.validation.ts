import { z } from 'zod';
import { envCoreSchema } from './env.core.schema.js';
import { envProvidersSchema } from './env.providers.schema.js';

const envSchema = envCoreSchema.merge(envProvidersSchema).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production' && data.ENABLE_TEST_AUTH === 'true') {
    ctx.addIssue({
      code: 'custom',
      path: ['ENABLE_TEST_AUTH'],
      message: 'ENABLE_TEST_AUTH cannot be true when NODE_ENV is production',
    });
  }

  if (data.NODE_ENV === 'production' && data.E2E_RELAX_THROTTLE === 'true') {
    ctx.addIssue({
      code: 'custom',
      path: ['E2E_RELAX_THROTTLE'],
      message: 'E2E_RELAX_THROTTLE cannot be true when NODE_ENV is production',
    });
  }
});

export type Env = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Environment validation failed: ${issues}`);
  }

  if (
    result.data.NODE_ENV === 'production' &&
    result.data.STRIPE_SECRET_KEY.startsWith('sk_test_')
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      'WARNING: STRIPE_SECRET_KEY appears to be a test key (sk_test_*) in production. Use a live Stripe secret key.',
    );
  }

  return result.data;
}
