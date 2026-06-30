import type { z } from 'zod';
import { envCoreSchema } from './env.core.schema.js';
import { envProvidersSchema } from './env.providers.schema.js';

const SRI_REQUIRED_KEYS = [
  'SRI_RUC',
  'SRI_DIGITAL_CERTIFICATE_PATH',
  'SRI_DIGITAL_CERTIFICATE_PASSWORD',
  'SRI_ESTABLISHMENT_CODE',
  'SRI_EMISSION_POINT_CODE',
] as const;

const PRODUCTION_SECRET_KEYS = [
  'AUTH_JWT_ACCESS_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'MEILI_API_KEY',
  'KUSHKI_PRIVATE_KEY',
  'KUSHKI_WEBHOOK_SECRET',
  'PAYPHONE_TOKEN',
  'PAYPHONE_STORE_ID',
  'MERCADOPAGO_ACCESS_TOKEN',
  'MERCADOPAGO_WEBHOOK_SECRET',
  'PLACETOPAY_LOGIN',
  'PLACETOPAY_SECRET_KEY',
  'EVOLUTION_API_KEY',
  'EVOLUTION_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'POSTHOG_KEY',
  'SRI_RUC',
  'SRI_SOL_KEY',
  'SRI_DIGITAL_CERTIFICATE_PASSWORD',
] as const;

function isPlaceholderValue(value: string): boolean {
  if (value === '') return true;
  const lower = value.toLowerCase();
  return (
    lower === 'change-me' ||
    lower === 'xxx' ||
    lower === 'whsec_xxx' ||
    lower === 're_xxx' ||
    lower === 'phc_xxx' ||
    lower.startsWith('dev-') ||
    lower.startsWith('test-') ||
    lower.startsWith('e2e-') ||
    lower.startsWith('pk_test_') ||
    lower.startsWith('sk_test_') ||
    (lower.startsWith('<') && lower.endsWith('>'))
  );
}

function getMissingSriCredentials(data: Env): string[] {
  if (data.SRI_MODE !== 'direct') return [];
  return SRI_REQUIRED_KEYS.filter((key) => {
    const value = data[key];
    return typeof value !== 'string' || value.trim() === '';
  });
}

function looksLikeLocalDatabase(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes('localhost') || lower.includes('127.0.0.1');
}

const envSchema = envCoreSchema.merge(envProvidersSchema).superRefine((data, ctx) => {
  if (data.APP_ENV !== 'production') return;

  if (data.ENABLE_TEST_AUTH === 'true') {
    ctx.addIssue({
      code: 'custom',
      path: ['ENABLE_TEST_AUTH'],
      message: 'ENABLE_TEST_AUTH cannot be true when APP_ENV is production',
    });
  }

  if (data.E2E_RELAX_THROTTLE === 'true') {
    ctx.addIssue({
      code: 'custom',
      path: ['E2E_RELAX_THROTTLE'],
      message: 'E2E_RELAX_THROTTLE cannot be true when APP_ENV is production',
    });
  }

  if (data.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    ctx.addIssue({
      code: 'custom',
      path: ['STRIPE_SECRET_KEY'],
      message: 'STRIPE_SECRET_KEY must be a live key (sk_live_*) when APP_ENV is production',
    });
  }

  for (const key of PRODUCTION_SECRET_KEYS) {
    const value = data[key];
    if (typeof value === 'string' && isPlaceholderValue(value)) {
      ctx.addIssue({
        code: 'custom',
        path: [key],
        message: `${key} cannot use a dev/placeholder value when APP_ENV is production`,
      });
    }
  }

  if (looksLikeLocalDatabase(data.DATABASE_URL)) {
    ctx.addIssue({
      code: 'custom',
      path: ['DATABASE_URL'],
      message: 'DATABASE_URL must not point to localhost or 127.0.0.1 when APP_ENV is production',
    });
  }

  for (const key of getMissingSriCredentials(data)) {
    ctx.addIssue({
      code: 'custom',
      path: [key],
      message: `${key} is required when APP_ENV is production and SRI_MODE is direct`,
    });
  }

  if (data.SRI_MODE === 'direct' && data.SRI_TEST_ENVIRONMENT === 'true') {
    ctx.addIssue({
      code: 'custom',
      path: ['SRI_TEST_ENVIRONMENT'],
      message: 'SRI_TEST_ENVIRONMENT must be false when APP_ENV is production',
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

  const data = result.data;
  const isProduction = data.APP_ENV === 'production';

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
    for (const key of getMissingSriCredentials(data)) {
      console.warn(`WARNING: ${key} is empty; SRI direct integration will fail in production`);
    }
  }

  return data;
}
