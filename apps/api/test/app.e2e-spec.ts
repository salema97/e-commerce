import './env.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

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

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const prismaMock = {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    };

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(new ConfigService(TEST_CONFIG))
      .overrideProvider(PrismaService)
      .useValue(prismaMock as never)
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes a public health endpoint', () => {
    return request(app.getHttpServer())
      .get('/v1/health')
      .expect(200);
  });

  it('rate-limits a public webhook endpoint to 10 req/min', async () => {
    const responses: number[] = [];

    for (let i = 0; i < 11; i++) {
      const res = await request(app.getHttpServer())
        .post('/v1/webhooks/clerk')
        .send({ type: 'user.created', data: { id: 'user_1' } });
      responses.push(res.status);
    }

    expect(responses.filter((s) => s !== 429).length).toBe(10);
    expect(responses).toContain(429);
  });
});
