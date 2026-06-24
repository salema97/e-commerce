import './env.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { BASE_TEST_CONFIG, bearerAuth } from './test-config.js';

const TEST_CONFIG = { ...BASE_TEST_CONFIG };

describe('RBAC (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const prismaMock = {
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

  it('returns 403 when a customer attempts to create a product', () => {
    return request(app.getHttpServer())
      .post('/v1/products')
      .set(bearerAuth('user_customer', 'CUSTOMER'))
      .send({
        name: 'Forbidden product',
        slug: 'forbidden-product',
        price: 9.99,
      })
      .expect(403);
  });
});
