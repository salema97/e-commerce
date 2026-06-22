import './env.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { OrderChannel, OrderStatus } from '@prisma/client';

vi.mock('@clerk/backend', async () => ({
  ...(await vi.importActual('@clerk/backend') as object),
  verifyToken: vi.fn(() => Promise.resolve({ sub: 'user_1', public_metadata: { role: 'CUSTOMER' } })),
}));

const TEST_CONFIG = {
  NODE_ENV: 'test', PORT: 3001, DATABASE_URL: 'postgresql://localhost:5432/test', REDIS_URL: 'redis://localhost:6379',
  CLERK_SECRET_KEY: 'sk_test_xxx', CLERK_WEBHOOK_SECRET: 'whsec_xxx',
  STRIPE_SECRET_KEY: 'sk_test_xxx', STRIPE_WEBHOOK_SECRET: 'whsec_xxx',
  STRIPE_SUCCESS_URL: 'https://example.com/success', STRIPE_CANCEL_URL: 'https://example.com/cancel',
  SRI_MODE: 'direct', SRI_RUC: '1792146739001', SRI_SOL_KEY: 'test', SRI_DIGITAL_CERTIFICATE_PATH: 'data:test',
  SRI_DIGITAL_CERTIFICATE_PASSWORD: 'test', SRI_ESTABLISHMENT_CODE: '001', SRI_EMISSION_POINT_CODE: '001', SRI_TEST_ENVIRONMENT: 'true',
};

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let prismaMock: ReturnType<typeof mockPrisma>;

  function mockPrisma() {
    const inv = { id: 'inv_1', productId: 'p1', variantId: null, quantity: 100, reservedQuantity: 0 };
    const tx = {
      inventory: { findFirst: vi.fn().mockResolvedValue(inv), update: vi.fn().mockResolvedValue({ ...inv, reservedQuantity: 2 }) },
    };
    return {
      $connect: vi.fn(), $disconnect: vi.fn(), $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      $transaction: vi.fn((cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'user_1', email: 'user@example.com' }) },
      product: { findUnique: vi.fn().mockResolvedValue({ id: 'p1', name: 'Product', sku: 'SKU', variants: [] }) },
      order: {
        findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(),
        create: vi.fn().mockResolvedValue({
          id: 'o1', orderNumber: 'ORD-1', status: OrderStatus.PAYMENT_PENDING, channel: OrderChannel.WEB,
          subtotal: 39.98, taxAmount: 0, shippingAmount: 0, discountAmount: 0, total: 39.98, couponCode: null,
          reservationExpiresAt: new Date('2026-06-22T01:00:00Z'),
          items: [{ id: 'oi1', productId: 'p1', variantId: null, name: 'Product', sku: 'SKU', price: 19.99, quantity: 2 }],
        }),
      },
      ...tx,
    };
  }

  beforeAll(async () => {
    prismaMock = mockPrisma();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService).useValue(new ConfigService(TEST_CONFIG))
      .overrideProvider(PrismaService).useValue(prismaMock as never)
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('POST /v1/orders creates an order and reserves inventory', async () => {
    const res = await request(app.getHttpServer()).post('/v1/orders').send({
      items: [{ productId: 'p1', quantity: 2, price: 19.99 }], customerEmail: 'guest@example.com', channel: OrderChannel.WEB,
    }).expect(201);
    expect(res.body.status).toBe(OrderStatus.PAYMENT_PENDING);
    expect(res.body.total).toBe(39.98);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it('POST /v1/orders rejects invalid payload', async () => {
    await request(app.getHttpServer()).post('/v1/orders').send({ items: [] }).expect(400);
  });

  it('GET /v1/orders/:id returns an order', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'o1', orderNumber: 'ORD-1', status: OrderStatus.PAYMENT_PENDING, channel: OrderChannel.WEB,
      subtotal: 39.98, taxAmount: 0, shippingAmount: 0, discountAmount: 0, total: 39.98, couponCode: null,
      reservationExpiresAt: new Date('2026-06-22T01:00:00Z'), items: [], statusHistory: [],
    });
    const res = await request(app.getHttpServer()).get('/v1/orders/o1').set('Authorization', 'Bearer token').expect(200);
    expect(res.body.id).toBe('o1');
  });
});
