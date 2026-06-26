import './env.js';
import { createE2eTestingModule } from './e2e-module.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { BASE_TEST_CONFIG } from './test-config.js';

const TEST_CONFIG = { ...BASE_TEST_CONFIG };

describe('Products (e2e)', () => {
  let app: INestApplication;
  let prismaMock: ReturnType<typeof mockPrisma>;

  function mockPrisma() {
    const activeProduct = {
      id: 'p1',
      slug: 'camiseta-algodon',
      name: 'Camiseta',
      status: 'ACTIVE',
      price: 19.99,
      images: [],
      variants: [],
      attributes: [],
      category: null,
      supplier: null,
      inventory: null,
    };

    return {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      product: {
        findUnique: vi.fn().mockImplementation(({ where }: { where: { id?: string; slug?: string } }) => {
          if (where.slug === 'camiseta-algodon') return Promise.resolve(activeProduct);
          if (where.slug === 'draft-product') {
            return Promise.resolve({ ...activeProduct, slug: 'draft-product', status: 'DRAFT' });
          }
          if (where.id === 'p1') return Promise.resolve(activeProduct);
          return Promise.resolve(null);
        }),
        findMany: vi.fn().mockResolvedValue([activeProduct]),
      },
    };
  }

  beforeAll(async () => {
    prismaMock = mockPrisma();
    const module = await createE2eTestingModule()
      .overrideProvider(ConfigService).useValue(new ConfigService(TEST_CONFIG))
      .overrideProvider(PrismaService).useValue(prismaMock as never)
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('GET /v1/products/slug/:slug returns an active product', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/products/slug/camiseta-algodon')
      .expect(200);
    expect(res.body.slug).toBe('camiseta-algodon');
    expect(res.body.status).toBe('ACTIVE');
  });

  it('GET /v1/products/slug/:slug returns 404 for draft products', async () => {
    await request(app.getHttpServer())
      .get('/v1/products/slug/draft-product')
      .expect(404);
  });

  it('GET /v1/products/slug/:slug returns 404 for unknown slug', async () => {
    await request(app.getHttpServer())
      .get('/v1/products/slug/no-existe')
      .expect(404);
  });
});
