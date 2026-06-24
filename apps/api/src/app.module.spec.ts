import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service.js';

const TEST_CONFIG = {
  NODE_ENV: 'test',
  PORT: 3001,
  DATABASE_URL: 'postgresql://localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  AUTH_JWT_ACCESS_SECRET: 'dev-access-secret-change-me-32chars-min',
  STRIPE_SECRET_KEY: 'sk_test_xxx',
  STRIPE_WEBHOOK_SECRET: 'whsec_xxx',
  STRIPE_SUCCESS_URL: 'https://example.com/success',
  STRIPE_CANCEL_URL: 'https://example.com/cancel',
  KUSHKI_PRIVATE_KEY: 'kushki_private_test',
  KUSHKI_WEBHOOK_SECRET: 'kushki_webhook_secret',
  PAYPHONE_TOKEN: 'payphone_token_test',
  PAYPHONE_STORE_ID: 'payphone_store_test',
  MERCADOPAGO_ACCESS_TOKEN: 'mp_token_test',
  MERCADOPAGO_WEBHOOK_SECRET: 'mp_webhook_secret',
  PLACETOPAY_LOGIN: 'ptp_login_test',
  PLACETOPAY_SECRET_KEY: 'ptp_secret_test',
  PLACETOPAY_BASE_URL: 'https://ptp.test',
  SRI_MODE: 'direct',
  SRI_RUC: '1792146739001',
  SRI_SOL_KEY: 'test',
  SRI_DIGITAL_CERTIFICATE_PATH: 'data:test',
  SRI_DIGITAL_CERTIFICATE_PASSWORD: 'test',
  SRI_ESTABLISHMENT_CODE: '001',
  SRI_EMISSION_POINT_CODE: '001',
  SRI_TEST_ENVIRONMENT: 'true',
  SRI_COMPANY_NAME: 'Empresa E-commerce',
  SRI_COMPANY_TRADE_NAME: 'E-commerce',
  SRI_COMPANY_ADDRESS: 'Direccion matriz',
  SRI_COMPANY_CONTRIBUYENTE_ESPECIAL: '536',
  SRI_COMPANY_OBLIGADO_CONTABILIDAD: 'SI',
};

describe('AppModule', () => {
  let module: Awaited<ReturnType<typeof Test.createTestingModule>['compile']>;
  let AppModule: typeof import('./app.module.js').AppModule;

  beforeEach(async () => {
    vi.stubEnv('STRIPE_SUCCESS_URL', TEST_CONFIG.STRIPE_SUCCESS_URL);
    vi.stubEnv('STRIPE_CANCEL_URL', TEST_CONFIG.STRIPE_CANCEL_URL);
    vi.stubEnv('KUSHKI_PRIVATE_KEY', TEST_CONFIG.KUSHKI_PRIVATE_KEY);
    vi.stubEnv('KUSHKI_WEBHOOK_SECRET', TEST_CONFIG.KUSHKI_WEBHOOK_SECRET);
    vi.stubEnv('PAYPHONE_TOKEN', TEST_CONFIG.PAYPHONE_TOKEN);
    vi.stubEnv('PAYPHONE_STORE_ID', TEST_CONFIG.PAYPHONE_STORE_ID);
    vi.stubEnv('MERCADOPAGO_ACCESS_TOKEN', TEST_CONFIG.MERCADOPAGO_ACCESS_TOKEN);
    vi.stubEnv('MERCADOPAGO_WEBHOOK_SECRET', TEST_CONFIG.MERCADOPAGO_WEBHOOK_SECRET);
    vi.stubEnv('PLACETOPAY_LOGIN', TEST_CONFIG.PLACETOPAY_LOGIN);
    vi.stubEnv('PLACETOPAY_SECRET_KEY', TEST_CONFIG.PLACETOPAY_SECRET_KEY);
    vi.stubEnv('PLACETOPAY_BASE_URL', TEST_CONFIG.PLACETOPAY_BASE_URL);
    vi.stubEnv('SRI_COMPANY_NAME', TEST_CONFIG.SRI_COMPANY_NAME);
    vi.stubEnv('SRI_COMPANY_TRADE_NAME', TEST_CONFIG.SRI_COMPANY_TRADE_NAME);
    vi.stubEnv('SRI_COMPANY_ADDRESS', TEST_CONFIG.SRI_COMPANY_ADDRESS);

    const imported = await import('./app.module.js');
    AppModule = imported.AppModule;

    const prismaMock = {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
    };

    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(new ConfigService(TEST_CONFIG))
      .overrideProvider(PrismaService)
      .useValue(prismaMock as never)
      .compile();
  });

  it('compiles the module', () => {
    expect(module).toBeDefined();
  });
});
