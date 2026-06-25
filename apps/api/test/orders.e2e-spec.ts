import './env.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { OrderChannel, OrderStatus } from '@prisma/client';
import { BASE_TEST_CONFIG, bearerAuth } from './test-config.js';

const TEST_CONFIG = {
  ...BASE_TEST_CONFIG,
  STRIPE_SUCCESS_URL: 'https://example.com/success',
  STRIPE_CANCEL_URL: 'https://example.com/cancel',
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
      product: {
        findUnique: vi.fn().mockResolvedValue({ id: 'p1', name: 'Product', sku: 'SKU', variants: [] }),
        findMany: vi.fn().mockResolvedValue([{ id: 'p1', taxCategory: 'STANDARD' }]),
      },
      shippingZone: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'zone_1',
            zoneType: 'DOMESTIC',
            isActive: true,
            provinces: [],
            flatRate: 5,
            freeShippingThreshold: 50,
          },
        ]),
      },
      order: {
        findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), update: vi.fn(),
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
    const res = await request(app.getHttpServer()).get('/v1/orders/o1').set(bearerAuth('user_1', 'CUSTOMER')).expect(200);
    expect(res.body.id).toBe('o1');
  });

  it('GET /v1/orders lists orders for admin', async () => {
    prismaMock.order.findMany.mockResolvedValue([
      {
        id: 'o1',
        orderNumber: 'ORD-1',
        userId: null,
        customerEmail: 'guest@example.com',
        customerPhone: null,
        customerName: null,
        status: OrderStatus.PAYMENT_PENDING,
        channel: OrderChannel.WEB,
        subtotal: 39.98,
        taxAmount: 0,
        shippingAmount: 0,
        discountAmount: 0,
        total: 39.98,
        createdAt: new Date('2026-06-22T01:00:00Z'),
        updatedAt: new Date('2026-06-22T01:00:00Z'),
        items: [],
      },
    ]);
    prismaMock.order.count.mockResolvedValue(1);

    const res = await request(app.getHttpServer())
      .get('/v1/orders')
      .set(bearerAuth('admin_1', 'ADMIN'))
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].orderNumber).toBe('ORD-1');
    expect(res.body.meta.total).toBe(1);
  });
});
