import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validate } from './env.validation.js';

const baseEnv = {
  NODE_ENV: 'production',
  APP_ENV: 'production',
  DATABASE_URL: 'postgresql://postgres:simulated_db_password@prod-db.example.com:5432/ecommerce',
  REDIS_URL: 'redis://prod-redis.example.com:6379',
  AUTH_JWT_ACCESS_SECRET: 'a'.repeat(32),
  STRIPE_SECRET_KEY: 'stripe_live_secret_key_simulated',
  STRIPE_WEBHOOK_SECRET: 'simulated_stripe_webhook_secret',
  AWS_ACCESS_KEY_ID: 'SIMULATED_AWS_ACCESS_KEY_ID',
  AWS_SECRET_ACCESS_KEY: 'simulated_aws_secret_access_key_not_real',
  MEILI_API_KEY: 'simulated_meili_master_key',
  KUSHKI_PRIVATE_KEY: 'simulated_kushki_private_key',
  KUSHKI_WEBHOOK_SECRET: 'simulated_kushki_webhook_secret',
  PAYPHONE_TOKEN: 'simulated_payphone_token',
  PAYPHONE_STORE_ID: 'simulated_payphone_store_id',
  MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-simulated-not-real',
  MERCADOPAGO_WEBHOOK_SECRET: 'simulated_mercadopago_webhook_secret',
  PLACETOPAY_LOGIN: 'simulated_placetopay_login',
  PLACETOPAY_SECRET_KEY: 'simulated_placetopay_secret_key',
  EVOLUTION_API_KEY: 'simulated_evolution_api_key',
  EVOLUTION_WEBHOOK_SECRET: 'simulated_evolution_webhook_secret',
  RESEND_API_KEY: 'resend_simulated_key',
  POSTHOG_KEY: 'posthog_simulated_key',
  SRI_MODE: 'direct',
  SRI_RUC: '1234567890001',
  SRI_SOL_KEY: 'simulated_sri_sol_key',
  SRI_DIGITAL_CERTIFICATE_PATH: '/secure/path/to/cert.p12',
  SRI_DIGITAL_CERTIFICATE_PASSWORD: 'simulated_sri_cert_password',
  SRI_ESTABLISHMENT_CODE: '001',
  SRI_EMISSION_POINT_CODE: '001',
  SRI_TEST_ENVIRONMENT: 'false',
};

describe('validate', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts a valid production environment', () => {
    expect(() => validate(baseEnv)).not.toThrow();
  });

  it('rejects test auth flags in production', () => {
    expect(() => validate({ ...baseEnv, ENABLE_TEST_AUTH: 'true' })).toThrow(
      'ENABLE_TEST_AUTH cannot be true when APP_ENV is production',
    );
  });

  it('rejects relaxed throttle in production', () => {
    expect(() => validate({ ...baseEnv, E2E_RELAX_THROTTLE: 'true' })).toThrow(
      'E2E_RELAX_THROTTLE cannot be true when APP_ENV is production',
    );
  });

  it('rejects Stripe test keys in production', () => {
    expect(() => validate({ ...baseEnv, STRIPE_SECRET_KEY: 'sk_test_xxx' })).toThrow(
      'STRIPE_SECRET_KEY must be a live key',
    );
  });

  it('rejects dev/placeholder/e2e/test provider secrets in production', () => {
    expect(() => validate({ ...baseEnv, KUSHKI_PRIVATE_KEY: 'dev-kushki-key' })).toThrow(
      'KUSHKI_PRIVATE_KEY cannot use a dev/placeholder value',
    );
    expect(() => validate({ ...baseEnv, EVOLUTION_API_KEY: 'change-me' })).toThrow(
      'EVOLUTION_API_KEY cannot use a dev/placeholder value',
    );
    expect(() =>
      validate({ ...baseEnv, EVOLUTION_WEBHOOK_SECRET: 'e2e-evolution-webhook-secret' }),
    ).toThrow('EVOLUTION_WEBHOOK_SECRET cannot use a dev/placeholder value');
    expect(() => validate({ ...baseEnv, PAYPHONE_TOKEN: 'test-payphone-token' })).toThrow(
      'PAYPHONE_TOKEN cannot use a dev/placeholder value',
    );
    expect(() => validate({ ...baseEnv, PLACETOPAY_SECRET_KEY: 'xxx' })).toThrow(
      'PLACETOPAY_SECRET_KEY cannot use a dev/placeholder value',
    );
    expect(() =>
      validate({ ...baseEnv, MERCADOPAGO_ACCESS_TOKEN: '<generate-strong-secret>' }),
    ).toThrow('MERCADOPAGO_ACCESS_TOKEN cannot use a dev/placeholder value');
    expect(() => validate({ ...baseEnv, MEILI_API_KEY: 'dev-master-key' })).toThrow(
      'MEILI_API_KEY cannot use a dev/placeholder value',
    );
    expect(() => validate({ ...baseEnv, AWS_ACCESS_KEY_ID: 'xxx' })).toThrow(
      'AWS_ACCESS_KEY_ID cannot use a dev/placeholder value',
    );
    expect(() => validate({ ...baseEnv, AWS_SECRET_ACCESS_KEY: 'xxx' })).toThrow(
      'AWS_SECRET_ACCESS_KEY cannot use a dev/placeholder value',
    );
    expect(() => validate({ ...baseEnv, STRIPE_WEBHOOK_SECRET: 'whsec_xxx' })).toThrow(
      'STRIPE_WEBHOOK_SECRET cannot use a dev/placeholder value',
    );
  });

  it('rejects provider-specific placeholder patterns in production', () => {
    expect(() => validate({ ...baseEnv, KUSHKI_PRIVATE_KEY: 'pk_test_xxx' })).toThrow(
      'KUSHKI_PRIVATE_KEY cannot use a dev/placeholder value',
    );
    expect(() => validate({ ...baseEnv, RESEND_API_KEY: 're_xxx' })).toThrow(
      'RESEND_API_KEY cannot use a dev/placeholder value',
    );
    expect(() => validate({ ...baseEnv, POSTHOG_KEY: 'phc_xxx' })).toThrow(
      'POSTHOG_KEY cannot use a dev/placeholder value',
    );
  });

  it('rejects generic placeholder tokens in production', () => {
    expect(() => validate({ ...baseEnv, AUTH_JWT_ACCESS_SECRET: '<generate-strong-secret>' })).toThrow(
      'AUTH_JWT_ACCESS_SECRET cannot use a dev/placeholder value',
    );
    expect(() => validate({ ...baseEnv, SRI_RUC: '<sri-ruc>' })).toThrow(
      'SRI_RUC cannot use a dev/placeholder value',
    );
    expect(() => validate({ ...baseEnv, SRI_SOL_KEY: '<sri-sol-key>' })).toThrow(
      'SRI_SOL_KEY cannot use a dev/placeholder value',
    );
    expect(() =>
      validate({ ...baseEnv, SRI_DIGITAL_CERTIFICATE_PASSWORD: '<sri-digital-certificate-password>' }),
    ).toThrow('SRI_DIGITAL_CERTIFICATE_PASSWORD cannot use a dev/placeholder value');
  });

  it('rejects local database URLs in production', () => {
    expect(() =>
      validate({ ...baseEnv, DATABASE_URL: 'postgresql://postgres:password@localhost:5432/ecommerce' }),
    ).toThrow('DATABASE_URL must not point to localhost');
    expect(() =>
      validate({ ...baseEnv, DATABASE_URL: 'postgresql://postgres:password@127.0.0.1:5432/ecommerce' }),
    ).toThrow('DATABASE_URL must not point to localhost');
  });

  it('rejects incomplete SRI credentials in production', () => {
    expect(() => validate({ ...baseEnv, SRI_RUC: '' })).toThrow(
      'SRI_RUC is required when APP_ENV is production and SRI_MODE is direct',
    );
  });

  it('rejects SRI test environment in production', () => {
    expect(() => validate({ ...baseEnv, SRI_TEST_ENVIRONMENT: 'true' })).toThrow(
      'SRI_TEST_ENVIRONMENT must be false when APP_ENV is production',
    );
  });

  it('warns but does not block in staging', () => {
    expect(() =>
      validate({
        ...baseEnv,
        APP_ENV: 'staging',
        STRIPE_SECRET_KEY: 'sk_test_xxx',
        ENABLE_TEST_AUTH: 'true',
      }),
    ).not.toThrow();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('STRIPE_SECRET_KEY appears to be a test key'),
    );
  });
});
