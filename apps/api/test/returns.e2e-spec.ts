import './env.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { DirectSriInvoiceProvider } from '../src/invoices/sri/sri-invoice.provider.js';
import { StripeProvider } from '../src/payments/stripe/stripe.provider.js';
import {
  OrderStatus,
  PaymentStatus,
  RefundStatus,
  PaymentProvider,
  ReturnStatus,
  CreditNoteStatus,
} from '@prisma/client';

vi.mock('@clerk/backend', async () => {
  const actual = await vi.importActual('@clerk/backend');
  return {
    ...(actual as object),
    verifyToken: vi.fn((token: string) =>
      Promise.resolve({
        sub: token.includes('admin') ? 'user_admin' : 'user_customer',
        public_metadata: { role: token.includes('admin') ? 'ADMIN' : 'CUSTOMER' },
      }),
    ),
  };
});

const TEST_CONFIG = {
  NODE_ENV: 'test',
  PORT: 3001,
  DATABASE_URL: 'postgresql://localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  CLERK_SECRET_KEY: 'sk_test_xxx',
  CLERK_WEBHOOK_SECRET: 'whsec_xxx',
  STRIPE_SECRET_KEY: 'sk_test_xxx',
  STRIPE_WEBHOOK_SECRET: 'whsec_xxx',
  STRIPE_SUCCESS_URL: 'https://example.com/success',
  STRIPE_CANCEL_URL: 'https://example.com/cancel',
  SRI_MODE: 'direct',
  SRI_RUC: '1792146739001',
  SRI_SOL_KEY: 'test',
  SRI_DIGITAL_CERTIFICATE_PATH: 'data:test',
  SRI_DIGITAL_CERTIFICATE_PASSWORD: 'test',
  SRI_ESTABLISHMENT_CODE: '001',
  SRI_EMISSION_POINT_CODE: '001',
  SRI_TEST_ENVIRONMENT: 'true',
};

describe('Returns (e2e)', () => {
  let app: INestApplication;
  let prismaMock: ReturnType<typeof buildPrismaMock>;
  let stripeRefundMock: ReturnType<typeof vi.fn>;
  let creditNoteMock: ReturnType<typeof vi.fn>;
  let inventoryUpdateMock: ReturnType<typeof vi.fn>;
  let storeCreditUpdateMock: ReturnType<typeof vi.fn>;
  let refundCreateMock: ReturnType<typeof vi.fn>;

  function buildPrismaMock() {
    const txClient = {
      storeCredit: { findFirst: vi.fn(), create: vi.fn(), update: storeCreditUpdateMock },
      inventory: {
        findFirst: vi.fn(),
        update: inventoryUpdateMock,
      },
    };

    return {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => cb(txClient)),
      __txClient: txClient,
      order: {
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      returnRequest: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      returnItem: { create: vi.fn() },
      refund: {
        create: refundCreateMock,
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      payment: { update: vi.fn() },
      product: { findUnique: vi.fn() },
      inventory: {
        findFirst: vi.fn(),
        update: inventoryUpdateMock,
      },
      storeCredit: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: storeCreditUpdateMock,
      },
      creditNote: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'log_1' }) },
    };
  }

  beforeAll(async () => {
    inventoryUpdateMock = vi.fn();
    storeCreditUpdateMock = vi.fn();
    refundCreateMock = vi.fn();
    prismaMock = buildPrismaMock();

    stripeRefundMock = vi.fn().mockResolvedValue({
      providerRefundId: 're_return_1',
      status: RefundStatus.COMPLETED,
    });

    creditNoteMock = vi.fn().mockResolvedValue({
      accessKey: '3'.repeat(49),
      status: 'AUTHORIZED',
      authorizationNumber: '1234567890',
      xmlContent: '<xml></xml>',
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

    const module = await Test.createTestingModule({ imports: [AppModule] })
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  function buildOrder(overrides: Partial<{ status: OrderStatus; invoice: object | null }> = {}) {
    return {
      id: 'o1',
      orderNumber: 'ORD-1',
      userId: 'user_customer',
      customerEmail: 'customer@example.com',
      customerPhone: null,
      status: overrides.status ?? OrderStatus.DELIVERED,
      subtotal: 100,
      taxAmount: 0,
      shippingAmount: 0,
      discountAmount: 0,
      total: 100,
      channel: 'WEB',
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        { id: 'oi1', productId: 'p1', variantId: null, name: 'Product', sku: 'SKU-1', price: 100, quantity: 1 },
      ],
      payments: [
        {
          id: 'pay1',
          provider: PaymentProvider.STRIPE,
          status: PaymentStatus.COMPLETED,
          amount: 100,
          providerTransactionId: 'pi_return',
        },
      ],
      invoice: overrides.invoice !== undefined ? overrides.invoice : { accessKey: '1'.repeat(49), authorizationNumber: '1234567890', createdAt: new Date() },
    };
  }

  it('POST /v1/returns/guest/request creates a return request with email verification', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      ...buildOrder(),
      userId: null,
      user: null,
    });
    prismaMock.returnRequest.create.mockResolvedValue({
      id: 'rr_guest',
      orderId: 'o1',
      userId: null,
      status: ReturnStatus.REQUESTED,
      reason: 'Damaged',
      items: [{ id: 'ri1', productId: 'p1', quantity: 1 }],
    });

    const res = await request(app.getHttpServer())
      .post('/v1/returns/guest/request')
      .send({
        orderId: 'o1',
        email: 'customer@example.com',
        items: [{ productId: 'p1', quantity: 1 }],
        reason: 'Damaged',
      })
      .expect(201);

    expect(res.body.status).toBe(ReturnStatus.REQUESTED);
    expect(prismaMock.returnRequest.create).toHaveBeenCalled();
  });

  it('POST /v1/returns/guest/request returns 403 when email does not match', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      ...buildOrder(),
      userId: null,
      user: null,
    });

    await request(app.getHttpServer())
      .post('/v1/returns/guest/request')
      .send({
        orderId: 'o1',
        email: 'wrong@example.com',
        items: [{ productId: 'p1', quantity: 1 }],
        reason: 'Damaged',
      })
      .expect(403);
  });

  it('POST /v1/orders/:id/returns creates a return request (customer)', async () => {
    prismaMock.order.findUnique.mockResolvedValue(buildOrder());
    prismaMock.returnRequest.create.mockResolvedValue({
      id: 'rr1',
      orderId: 'o1',
      userId: 'user_customer',
      status: ReturnStatus.REQUESTED,
      reason: 'Damaged',
      items: [{ id: 'ri1', productId: 'p1', quantity: 1 }],
    });

    const res = await request(app.getHttpServer())
      .post('/v1/orders/o1/returns')
      .set('Authorization', 'Bearer valid-customer-token')
      .send({
        items: [{ productId: 'p1', quantity: 1 }],
        reason: 'Damaged',
      })
      .expect(201);

    expect(res.body.status).toBe(ReturnStatus.REQUESTED);
    expect(prismaMock.returnRequest.create).toHaveBeenCalled();
  });

  it('admin approves, inspects and resolves a return with original payment', async () => {
    prismaMock.returnRequest.findUnique.mockResolvedValue({
      id: 'rr1',
      orderId: 'o1',
      userId: 'user_customer',
      status: ReturnStatus.REQUESTED,
      reason: 'Damaged',
      refundMethod: null,
      items: [{ id: 'ri1', productId: 'p1', productVariantId: null, quantity: 1, refundValue: null }],
    });
    prismaMock.returnRequest.update.mockResolvedValue({
      id: 'rr1',
      status: ReturnStatus.APPROVED,
      approvedById: 'user_admin',
      items: [],
    });

    await request(app.getHttpServer())
      .patch('/v1/returns/rr1/status')
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ status: ReturnStatus.APPROVED })
      .expect(200);

    prismaMock.returnRequest.findUnique.mockResolvedValue({
      id: 'rr1',
      status: ReturnStatus.APPROVED,
      items: [{ id: 'ri1', productId: 'p1', productVariantId: null, quantity: 1, refundValue: null }],
    });
    prismaMock.returnRequest.update.mockResolvedValue({
      id: 'rr1',
      status: ReturnStatus.INSPECTION,
      inspectedAt: new Date(),
      items: [],
    });

    await request(app.getHttpServer())
      .patch('/v1/returns/rr1/status')
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ status: ReturnStatus.INSPECTION })
      .expect(200);

    prismaMock.order.findUnique.mockResolvedValue(buildOrder());
    prismaMock.returnRequest.findUnique.mockResolvedValue({
      id: 'rr1',
      orderId: 'o1',
      userId: 'user_customer',
      status: ReturnStatus.INSPECTION,
      reason: 'Damaged',
      refundMethod: null,
      items: [{ id: 'ri1', productId: 'p1', productVariantId: null, quantity: 1, refundValue: null }],
      order: buildOrder(),
    });
    refundCreateMock.mockResolvedValue({
      id: 'r1',
      orderId: 'o1',
      paymentId: 'pay1',
      providerRefundId: 're_return_1',
      amount: 100,
      reason: 'Damaged',
      status: RefundStatus.COMPLETED,
      requestedById: 'user_admin',
      returnRequestId: 'rr1',
      providerMetadata: { type: 'full' },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.returnRequest.update.mockResolvedValue({
      id: 'rr1',
      status: ReturnStatus.RESOLVED,
      refundMethod: 'ORIGINAL_PAYMENT',
      resolvedAt: new Date(),
      items: [],
    });
    prismaMock.__txClient.inventory.findFirst.mockResolvedValue({ id: 'inv1', productId: 'p1', variantId: null, quantity: 10, reservedQuantity: 0 });
    prismaMock.creditNote.findFirst.mockResolvedValue(null);
    prismaMock.creditNote.create.mockResolvedValue({
      id: 'cn1',
      accessKey: '3'.repeat(49),
      status: CreditNoteStatus.AUTHORIZED,
      totalAmount: 100,
      xmlContent: '<xml></xml>',
    });
    prismaMock.creditNote.findUniqueOrThrow.mockResolvedValue({
      id: 'cn1',
      accessKey: '3'.repeat(49),
      status: CreditNoteStatus.AUTHORIZED,
      totalAmount: 100,
      xmlContent: '<xml></xml>',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app.getHttpServer())
      .post('/v1/returns/rr1/resolve')
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ refundMethod: 'ORIGINAL_PAYMENT' })
      .expect(200);

    expect(res.body.status).toBe(ReturnStatus.RESOLVED);
    expect(stripeRefundMock).toHaveBeenCalledWith('pi_return', 100);
    expect(inventoryUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ quantity: { increment: 1 } }) }),
    );
    expect(creditNoteMock).toHaveBeenCalled();
  });

  it('resolving a return without invoice skips credit note but still restocks', async () => {
    prismaMock.order.findUnique.mockResolvedValue(buildOrder({ invoice: null }));
    prismaMock.returnRequest.findUnique.mockResolvedValue({
      id: 'rr2',
      orderId: 'o1',
      userId: 'user_customer',
      status: ReturnStatus.INSPECTION,
      reason: 'Wrong size',
      refundMethod: null,
      items: [{ id: 'ri1', productId: 'p1', productVariantId: null, quantity: 1, refundValue: null }],
      order: buildOrder({ invoice: null }),
    });
    refundCreateMock.mockResolvedValue({
      id: 'r2',
      orderId: 'o1',
      paymentId: 'pay1',
      providerRefundId: 're_return_2',
      amount: 100,
      reason: 'Wrong size',
      status: RefundStatus.COMPLETED,
      requestedById: 'user_admin',
      returnRequestId: 'rr2',
      providerMetadata: { type: 'full' },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.returnRequest.update.mockResolvedValue({
      id: 'rr2',
      status: ReturnStatus.RESOLVED,
      refundMethod: 'ORIGINAL_PAYMENT',
      resolvedAt: new Date(),
      items: [],
    });
    prismaMock.__txClient.inventory.findFirst.mockResolvedValue({ id: 'inv1', productId: 'p1', variantId: null, quantity: 5, reservedQuantity: 0 });

    const res = await request(app.getHttpServer())
      .post('/v1/returns/rr2/resolve')
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ refundMethod: 'ORIGINAL_PAYMENT' })
      .expect(200);

    expect(res.body.status).toBe(ReturnStatus.RESOLVED);
    expect(creditNoteMock).not.toHaveBeenCalled();
    expect(inventoryUpdateMock).toHaveBeenCalled();
  });

  it('returns 403 when a customer tries to resolve a return', async () => {
    await request(app.getHttpServer())
      .post('/v1/returns/rr1/resolve')
      .set('Authorization', 'Bearer valid-customer-token')
      .send({ refundMethod: 'ORIGINAL_PAYMENT' })
      .expect(403);
  });
});
