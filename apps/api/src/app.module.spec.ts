import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service.js';

const TEST_CONFIG = {
  NODE_ENV: 'test',
  PORT: 3001,
  DATABASE_URL: 'postgresql://localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  CLERK_SECRET_KEY: 'sk_test_xxx',
  CLERK_WEBHOOK_SECRET: 'whsec_xxx',
  STRIPE_SECRET_KEY: 'sk_test_xxx',
  STRIPE_WEBHOOK_SECRET: 'whsec_xxx',
  STRIPE_SUCCESS_URL: 'https://example.com/success',
  STRIPE_CANCEL_URL: 'https://example.com/cancel',
  SRI_MODE: 'direct',
  SRI_RUC: '1792146739001',
  SRI_SOL_KEY: 'test',
  SRI_DIGITAL_CERTIFICATE_PATH: 'data:test',
  SRI_DIGITAL_CERTIFICATE_PASSWORD: 'test',
  SRI_ESTABLISHMENT_CODE: '001',
  SRI_EMISSION_POINT_CODE: '001',
  SRI_TEST_ENVIRONMENT: 'true',
};

describe('AppModule', () => {
  let module: Awaited<ReturnType<typeof Test.createTestingModule>['compile']>;
  let AppModule: typeof import('./app.module.js').AppModule;

  beforeEach(async () => {
    vi.stubEnv('STRIPE_SUCCESS_URL', TEST_CONFIG.STRIPE_SUCCESS_URL);
    vi.stubEnv('STRIPE_CANCEL_URL', TEST_CONFIG.STRIPE_CANCEL_URL);

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
