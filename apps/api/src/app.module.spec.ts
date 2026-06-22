import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
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
  let module: Awaited<ReturnType<typeof Test.createTestingModule>['compile'] >;

  beforeEach(async () => {
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
