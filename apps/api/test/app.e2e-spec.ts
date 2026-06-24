import './env.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { BASE_TEST_CONFIG } from './test-config.js';

const TEST_CONFIG = { ...BASE_TEST_CONFIG };

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
        .post('/v1/webhooks/stripe')
        .send({ type: 'payment_intent.succeeded', data: { object: { id: 'pi_1' } } });
      responses.push(res.status);
    }

    expect(responses.filter((s) => s !== 429).length).toBe(10);
    expect(responses).toContain(429);
  });
});
