import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validate } from './env.validation.js';

const baseEnv = {
  NODE_ENV: 'production',
  APP_ENV: 'production',
  DATABASE_URL: 'postgresql://localhost/db',
  REDIS_URL: 'redis://localhost:6379',
  AUTH_JWT_ACCESS_SECRET: 'a'.repeat(32),
  STRIPE_SECRET_KEY: 'sk_live_xxx',
  STRIPE_WEBHOOK_SECRET: 'whsec_xxx',
  KUSHKI_PRIVATE_KEY: 'pk_live_kushki',
  KUSHKI_WEBHOOK_SECRET: 'whsec_kushki_live',
  PAYPHONE_TOKEN: 'live_payphone_token',
  PAYPHONE_STORE_ID: 'live_store_id',
  MERCADOPAGO_ACCESS_TOKEN: 'live_mp_token',
  MERCADOPAGO_WEBHOOK_SECRET: 'whsec_mp_live',
  PLACETOPAY_LOGIN: 'live_ptp_login',
  PLACETOPAY_SECRET_KEY: 'live_ptp_secret',
  EVOLUTION_API_KEY: 'live_evolution_key',
  EVOLUTION_WEBHOOK_SECRET: 'live_evolution_wh',
  SRI_MODE: 'direct',
  SRI_RUC: '1234567890001',
  SRI_SOL_KEY: 'sol-key',
  SRI_DIGITAL_CERTIFICATE_PATH: '/path/to/cert.p12',
  SRI_DIGITAL_CERTIFICATE_PASSWORD: 'secret',
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
