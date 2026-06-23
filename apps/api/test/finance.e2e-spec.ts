import './env.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { verifyToken } from '@clerk/backend';
import { IncomeSource, Prisma } from '@prisma/client';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

vi.mock('@clerk/backend', async () => {
  const actual = await vi.importActual('@clerk/backend');
  return {
    ...(actual as object),
    verifyToken: vi.fn(),
  };
});

const TEST_CONFIG = {
  NODE_ENV: 'test',
  PORT: 3001,
  DATABASE_URL: 'postgresql://localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  CLERK_SECRET_KEY: 'sk_test_xxx',
  CLERK_WEBHOOK_SECRET: 'whsec_xxx',
  STRIPE_SECRET_KEY: 'sk_test_xxx',
  STRIPE_WEBHOOK_SECRET: 'whsec_xxx',
  R2_ACCOUNT_ID: 'test-account',
  R2_ACCESS_KEY_ID: 'test-key',
  R2_SECRET_ACCESS_KEY: 'test-secret',
  R2_BUCKET_NAME: 'test-bucket',
  SRI_MODE: 'direct',
  SRI_RUC: '1792146739001',
  SRI_SOL_KEY: 'test',
  SRI_DIGITAL_CERTIFICATE_PATH: 'data:test',
  SRI_DIGITAL_CERTIFICATE_PASSWORD: 'test',
  SRI_ESTABLISHMENT_CODE: '001',
  SRI_EMISSION_POINT_CODE: '001',
  SRI_TEST_ENVIRONMENT: 'true',
  SRI_QUEUE_ENABLED: 'false',
};

describe('FinanceController (e2e)', () => {
  let app: INestApplication;
  let incomeCreateMock: ReturnType<typeof vi.fn>;
  let incomeFindManyMock: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    incomeCreateMock = vi.fn();
    incomeFindManyMock = vi.fn();

    const prismaMock = {
      income: {
        create: incomeCreateMock,
        findMany: incomeFindManyMock,
      },
      $connect: vi.fn(),
      $disconnect: vi.fn(),
    };

    const configMock = new ConfigService(TEST_CONFIG);

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(configMock)
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows FINANCE role to create income', async () => {
    vi.mocked(verifyToken).mockResolvedValueOnce({
      sub: 'user_finance',
      public_metadata: { role: 'FINANCE' },
    } as never);

    incomeCreateMock.mockResolvedValue({
      id: 'inc_1',
      source: IncomeSource.OTHER,
      amount: new Prisma.Decimal(100),
      date: new Date('2026-06-01'),
      relatedOrderId: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app.getHttpServer())
      .post('/v1/finance/incomes')
      .set('Authorization', 'Bearer finance-token')
      .send({ source: 'OTHER', amount: 100 })
      .expect(201);

    expect(response.body.amount).toBe(100);
    expect(incomeCreateMock).toHaveBeenCalled();
  });

  it('denies SUPPORT role on finance incomes list', async () => {
    vi.mocked(verifyToken).mockResolvedValueOnce({
      sub: 'user_support',
      public_metadata: { role: 'SUPPORT' },
    } as never);

    await request(app.getHttpServer())
      .get('/v1/finance/incomes')
      .set('Authorization', 'Bearer support-token')
      .expect(403);
  });
});
