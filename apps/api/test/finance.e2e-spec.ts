import './env.js';
import { createE2eTestingModule } from './e2e-module.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { IncomeSource, Prisma } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { BASE_TEST_CONFIG, bearerAuth } from './test-config.js';

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

    const configMock = new ConfigService(BASE_TEST_CONFIG);

    const module = await createE2eTestingModule()
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
      .set(bearerAuth('user_finance', 'FINANCE'))
      .send({ source: 'OTHER', amount: 100 })
      .expect(201);

    expect(response.body.amount).toBe(100);
    expect(incomeCreateMock).toHaveBeenCalled();
  });

  it('denies SUPPORT role on finance incomes list', async () => {
    await request(app.getHttpServer())
      .get('/v1/finance/incomes')
      .set(bearerAuth('user_support', 'SUPPORT'))
      .expect(403);
  });
});
