import './env.js';
import { createE2eTestingModule } from './e2e-module.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { DirectSriInvoiceProvider } from '../src/invoices/sri/sri-invoice.provider.js';
import { StripeProvider } from '../src/payments/stripe/stripe.provider.js';
import { OrderStatus, PaymentStatus, RefundStatus, PaymentProvider, OrderChannel } from '@prisma/client';
import { BASE_TEST_CONFIG, bearerAuth } from './test-config.js';

const TEST_CONFIG = {
  ...BASE_TEST_CONFIG,
  STRIPE_SUCCESS_URL: 'https://example.com/success',
  STRIPE_CANCEL_URL: 'https://example.com/cancel',
};

describe('Refunds (e2e)', () => {
  let app: INestApplication;
  let prismaMock: ReturnType<typeof buildPrisma>;
  let stripeRefundMock: ReturnType<typeof vi.fn>;
  let creditNoteMock: ReturnType<typeof vi.fn>;

  function buildPrisma() {
    return {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      $transaction: vi.fn(),
      order: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
      payment: { update: vi.fn().mockResolvedValue({}) },
      refund: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
      receipt: { findUnique: vi.fn(), create: vi.fn() },
      coupon: { findUnique: vi.fn(), update: vi.fn() },
      user: { findUnique: vi.fn() },
      product: { findUnique: vi.fn() },
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'log_1' }) },
    };
  }

  beforeAll(async () => {
    prismaMock = buildPrisma();
    stripeRefundMock = vi.fn().mockResolvedValue({
      providerRefundId: 're_e2e_1',
      status: RefundStatus.COMPLETED,
    });
    creditNoteMock = vi.fn().mockResolvedValue({
      accessKey: '2'.repeat(49),
      status: 'AUTHORIZED',
    });

    const stripeProviderMock = {
      createPaymentIntent: vi.fn(),
      createCheckoutSession: vi.fn(),
      capturePayment: vi.fn(),
      confirmPayment: vi.fn(),
      refund: stripeRefundMock,
      validateWebhookSignature: vi.fn(),
      parseWebhookPayload: vi.fn(),
    };

    const invoiceProviderMock = {
      issueInvoice: vi.fn(),
      getInvoiceStatus: vi.fn(),
      issueCreditNote: creditNoteMock,
    };

    const module = await createE2eTestingModule()
      .overrideProvider(ConfigService)
      .useValue(new ConfigService(TEST_CONFIG))
      .overrideProvider(PrismaService)
      .useValue(prismaMock as never)
      .overrideProvider(StripeProvider)
      .useValue(stripeProviderMock)
      .overrideProvider(DirectSriInvoiceProvider)
      .useValue(invoiceProviderMock)
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/orders/:id/refunds creates a full refund (admin)', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'o1',
      orderNumber: 'ORD-1',
      status: OrderStatus.DELIVERED,
      total: 100,
      payments: [
        {
          id: 'pay1',
          provider: PaymentProvider.STRIPE,
          status: PaymentStatus.COMPLETED,
          amount: 100,
          providerTransactionId: 'pi_e2e',
        },
      ],
      invoice: { accessKey: '1'.repeat(49) },
    });
    prismaMock.refund.create.mockResolvedValue({
      id: 'r1',
      orderId: 'o1',
      paymentId: 'pay1',
      providerRefundId: 're_e2e_1',
      amount: 100,
      reason: 'full refund',
      status: RefundStatus.COMPLETED,
      requestedById: 'user_admin',
      approvedById: null,
      providerMetadata: { type: 'full' },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app.getHttpServer())
      .post('/v1/orders/o1/refunds')
      .set(bearerAuth('user_admin', 'ADMIN'))
      .send({ amount: 100, type: 'full', reason: 'customer request' })
      .expect(201);

    expect(res.body.id).toBe('r1');
    expect(res.body.type).toBe('full');
    expect(res.body.status).toBe(RefundStatus.COMPLETED);
    expect(stripeRefundMock).toHaveBeenCalledWith('pi_e2e', 100);
    expect(creditNoteMock).not.toHaveBeenCalled();
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: 'user_admin',
          resource: 'Refund',
          action: 'CREATE',
          resourceId: 'r1',
        }),
      }),
    );
  });

  it('GET /v1/orders/:id/refunds lists refunds (admin)', async () => {
    prismaMock.refund.findMany.mockResolvedValue([
      {
        id: 'r1', orderId: 'o1', paymentId: 'pay1', providerRefundId: 're_1',
        amount: 100, reason: 'full', status: RefundStatus.COMPLETED,
        requestedById: null, approvedById: null,
        providerMetadata: { type: 'full' },
        createdAt: new Date(), updatedAt: new Date(),
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/v1/orders/o1/refunds')
      .set(bearerAuth('user_admin', 'ADMIN'))
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('r1');
  });

  it('PATCH /v1/refunds/:id/approve approves a pending refund (admin)', async () => {
    prismaMock.refund.findUnique.mockResolvedValue({
      id: 'r2', status: RefundStatus.PENDING,
    });
    prismaMock.refund.update.mockResolvedValue({
      id: 'r2', orderId: 'o1', paymentId: 'pay1', providerRefundId: 're_2',
      amount: 30, reason: 'partial', status: RefundStatus.COMPLETED,
      requestedById: null, approvedById: 'user_admin',
      providerMetadata: { type: 'partial' },
      createdAt: new Date(), updatedAt: new Date(),
    });

    const res = await request(app.getHttpServer())
      .patch('/v1/refunds/r2/approve')
      .set(bearerAuth('user_admin', 'ADMIN'))
      .expect(200);

    expect(res.body.status).toBe(RefundStatus.COMPLETED);
    expect(res.body.approvedById).toBe('user_admin');
  });

  it('returns 401 without authorization on refund create', async () => {
    await request(app.getHttpServer())
      .post('/v1/orders/o1/refunds')
      .send({ amount: 100, type: 'full' })
      .expect(401);
  });

  it('returns 400 when refund amount exceeds order total', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'o1',
      orderNumber: 'ORD-1',
      status: OrderStatus.DELIVERED,
      total: 50,
      payments: [
        {
          id: 'pay1',
          provider: PaymentProvider.STRIPE,
          status: PaymentStatus.COMPLETED,
          amount: 50,
          providerTransactionId: 'pi_e2e',
        },
      ],
      invoice: { accessKey: '1'.repeat(49) },
    });

    await request(app.getHttpServer())
      .post('/v1/orders/o1/refunds')
      .set(bearerAuth('user_admin', 'ADMIN'))
      .send({ amount: 50, type: 'partial' })
      .expect(400);
  });

  it('POST /v1/orders/:id/receipt generates a receipt (admin)', async () => {
    prismaMock.receipt.findUnique.mockResolvedValue(null);
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'o1',
      orderNumber: 'ORD-1',
      customerEmail: 'cust@example.com',
    });
    prismaMock.receipt.create.mockResolvedValue({
      id: 'rc1',
      orderId: 'o1',
      number: 'RCP-ORD-1-X',
      url: 'receipts://o1/RCP-ORD-1-X.pdf',
      createdAt: new Date(),
    });

    const res = await request(app.getHttpServer())
      .post('/v1/orders/o1/receipt')
      .set(bearerAuth('user_admin', 'ADMIN'))
      .expect(201);

    expect(res.body.id).toBe('rc1');
    expect(res.body.emailDelivered).toBe(true);
  });
});
