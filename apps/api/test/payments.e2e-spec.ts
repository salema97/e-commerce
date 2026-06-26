import './env.js';
import { createE2eTestingModule } from './e2e-module.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { StripeProvider } from '../src/payments/stripe/stripe.provider.js';
import { KushkiProvider } from '../src/payments/kushki/kushki.provider.js';
import { PayPhoneProvider } from '../src/payments/payphone/payphone.provider.js';
import { MercadoPagoProvider } from '../src/payments/mercadopago/mercadopago.provider.js';
import { PlaceToPayProvider } from '../src/payments/placetopay/placetopay.provider.js';
import { PaymentProviderFactory } from '../src/payments/payment-provider.factory.js';
import { OrderStatus, PaymentProvider, PaymentStatus } from '@prisma/client';
import { BASE_TEST_CONFIG } from './test-config.js';

const TEST_CONFIG = {
  ...BASE_TEST_CONFIG,
  STRIPE_SUCCESS_URL: 'https://example.com/success',
  STRIPE_CANCEL_URL: 'https://example.com/cancel',
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
    const localProviderMock = {
      validateWebhookSignature: vi.fn((payload: Buffer, signature: string) =>
        signature === 'valid-signature',
      ),
      parseWebhookPayload: vi.fn(async (payload: unknown) => {
        const dto = payload as { transactionReference?: string; id?: string; status?: string };
        return {
          providerTransactionId: dto.transactionReference ?? dto.id ?? 'local_txn',
          status: PaymentStatus.COMPLETED,
          metadata: payload as Record<string, unknown>,
        };
      }),
    };
    const module = await createE2eTestingModule()
      .overrideProvider(ConfigService).useValue(new ConfigService(TEST_CONFIG))
      .overrideProvider(PrismaService).useValue(prismaMock as never)
      .overrideProvider(StripeProvider).useValue(stripeProviderMock)
      .overrideProvider(KushkiProvider).useValue(localProviderMock)
      .overrideProvider(PayPhoneProvider).useValue(localProviderMock)
      .overrideProvider(MercadoPagoProvider).useValue(localProviderMock)
      .overrideProvider(PlaceToPayProvider).useValue(localProviderMock)
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

  it('POST /v1/webhooks/payments/:provider routes to the correct adapter and confirms payment', async () => {
    prismaMock.payment.findFirst.mockResolvedValueOnce({
      id: 'pay_kushki',
      orderId: 'o1',
      provider: PaymentProvider.KUSHKI,
      status: PaymentStatus.PENDING,
    });

    const res = await request(app.getHttpServer())
      .post('/v1/webhooks/payments/kushki')
      .set('x-provider-signature', 'valid-signature')
      .send({ transactionReference: 'kushki_txn_1', status: 'approved' })
      .expect(200);

    expect(res.body).toEqual({
      received: true,
      providerTransactionId: 'kushki_txn_1',
      status: PaymentStatus.COMPLETED,
    });
    expect(prismaMock.payment.update).toHaveBeenCalled();
    expect(prismaMock.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: OrderStatus.PROCESSING } }),
    );
  });

  it('rejects local provider webhook with invalid signature', async () => {
    await request(app.getHttpServer())
      .post('/v1/webhooks/payments/payphone')
      .set('x-provider-signature', 'invalid-signature')
      .send({ id: 'pp_txn_1', transactionStatus: 1 })
      .expect(401);
  });

  it('returns 400 for unknown provider name', async () => {
    await request(app.getHttpServer())
      .post('/v1/webhooks/payments/unknown')
      .set('x-provider-signature', 'valid-signature')
      .send({})
      .expect(400);
  });

  it('factory resolves the configured local provider for Ecuador orders', async () => {
    const factory = app.get(PaymentProviderFactory);
    const resolved = factory.resolveProvider({
      country: 'Ecuador',
      method: 'mercadopago',
    });
    expect(resolved).toBe(app.get(MercadoPagoProvider));
  });
});
