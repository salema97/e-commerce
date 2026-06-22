import './env.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { StripeProvider } from '../src/payments/stripe/stripe.provider.js';
import { OrderStatus, PaymentProvider, PaymentStatus } from '@prisma/client';

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

describe('Payments (e2e)', () => {
  let app: INestApplication;
  let prismaMock: ReturnType<typeof mockPrisma>;

  function mockPrisma() {
    const inv = { id: 'inv_1', productId: 'p1', variantId: null, quantity: 100, reservedQuantity: 2 };
    const tx = {
      inventory: { findFirst: vi.fn().mockResolvedValue(inv), update: vi.fn().mockResolvedValue({ ...inv, reservedQuantity: 0, quantity: 98 }) },
      payment: { findUnique: vi.fn().mockResolvedValue({ id: 'pay_1', orderId: 'o1', status: PaymentStatus.PENDING, metadata: {} }), update: vi.fn() },
      order: { update: vi.fn().mockResolvedValue({ id: 'o1', status: OrderStatus.PROCESSING }) },
      orderStatusHistory: { create: vi.fn() },
    };
    return {
      $connect: vi.fn(), $disconnect: vi.fn(), $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      $transaction: vi.fn((cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
      ...tx,
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'user_1', email: 'user@example.com' }) },
      product: { findUnique: vi.fn().mockResolvedValue({ id: 'p1', name: 'Product', sku: 'SKU', variants: [] }) },
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'o1', total: 39.98,
          items: [{ id: 'oi1', productId: 'p1', variantId: null, quantity: 2 }],
        }),
        findMany: vi.fn(),
        update: vi.fn().mockResolvedValue({ id: 'o1', status: OrderStatus.PROCESSING }),
        create: vi.fn().mockResolvedValue({
          id: 'o1', orderNumber: 'ORD-1', status: OrderStatus.PAYMENT_PENDING, channel: 'WEB',
          subtotal: 39.98, taxAmount: 0, shippingAmount: 0, discountAmount: 0, total: 39.98, couponCode: null,
          reservationExpiresAt: new Date('2026-06-22T01:00:00Z'),
          items: [{ id: 'oi1', productId: 'p1', variantId: null, name: 'Product', sku: 'SKU', price: 19.99, quantity: 2 }],
        }),
      },
      payment: {
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue({ id: 'pay_1', orderId: 'o1', status: PaymentStatus.PENDING, metadata: {} }),
        create: vi.fn().mockResolvedValue({ id: 'pay_1', orderId: 'o1', status: PaymentStatus.PENDING }),
        update: vi.fn().mockResolvedValue({ id: 'pay_1', status: PaymentStatus.COMPLETED }),
      },
      auditLog: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn() },
    };
  }

  beforeAll(async () => {
    prismaMock = mockPrisma();
    const stripeProviderMock = {
      validateWebhookSignature: vi.fn(() => true),
    };
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService).useValue(new ConfigService(TEST_CONFIG))
      .overrideProvider(PrismaService).useValue(prismaMock as never)
      .overrideProvider(StripeProvider).useValue(stripeProviderMock)
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useBodyParser('json', {
      verify: (req: { rawBody?: Buffer }, res: unknown, buf: Buffer) => {
        req.rawBody = buf;
      },
    });
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('POST /v1/webhooks/stripe handles checkout.session.completed and confirms order', async () => {
    const payload = {
      id: 'evt_checkout_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          payment_intent: 'pi_123',
          amount_total: 3998,
          currency: 'usd',
          metadata: { orderId: 'o1' },
        },
      },
    };

    await request(app.getHttpServer())
      .post('/v1/webhooks/stripe')
      .set('stripe-signature', 'sig_valid')
      .send(payload)
      .expect(200);

    expect(prismaMock.payment.create).toHaveBeenCalled();
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it('POST /v1/webhooks/stripe ignores duplicate event ids', async () => {
    const payload = {
      id: 'evt_duplicate',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123' } },
    };

    await request(app.getHttpServer())
      .post('/v1/webhooks/stripe')
      .set('stripe-signature', 'sig_valid')
      .send(payload)
      .expect(200);

    prismaMock.auditLog.findFirst.mockResolvedValue({ id: 'log_duplicate' });
    prismaMock.payment.findFirst.mockClear();
    prismaMock.payment.update.mockClear();

    await request(app.getHttpServer())
      .post('/v1/webhooks/stripe')
      .set('stripe-signature', 'sig_valid')
      .send(payload)
      .expect(200);

    expect(prismaMock.payment.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.payment.update).not.toHaveBeenCalled();
  });
});
