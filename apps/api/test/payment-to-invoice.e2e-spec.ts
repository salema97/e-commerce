import './env.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { createHmac } from 'crypto';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { StripeProvider } from '../src/payments/stripe/stripe.provider.js';
import { DirectSriInvoiceProvider } from '../src/invoices/sri/sri-invoice.provider.js';
import { PaymentStatus } from '../src/payments/entities/payment-status.enum.js';
import { InvoiceStatus } from '../src/invoices/invoice-status.enum.js';

const TEST_STRIPE_WEBHOOK_SECRET = 'whsec_testsecret';

function signStripeWebhook(
  payload: object,
  timestamp = String(Math.floor(Date.now() / 1000)),
): { signature: string; body: string } {
  const body = JSON.stringify(payload);
  const signedContent = `${timestamp}.${body}`;
  const signature = createHmac('sha256', TEST_STRIPE_WEBHOOK_SECRET)
    .update(signedContent)
    .digest('hex');
  return { signature: `t=${timestamp},v1=${signature}`, body };
}

const TEST_CONFIG = {
  NODE_ENV: 'test',
  PORT: 3001,
  DATABASE_URL: 'postgresql://localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  CLERK_SECRET_KEY: 'sk_test_xxx',
  CLERK_WEBHOOK_SECRET: 'whsec_xxx',
  STRIPE_SECRET_KEY: 'sk_test_xxx',
  STRIPE_WEBHOOK_SECRET: TEST_STRIPE_WEBHOOK_SECRET,
  SRI_MODE: 'direct',
  SRI_RUC: '1792146739001',
  SRI_SOL_KEY: 'test',
  SRI_DIGITAL_CERTIFICATE_PATH: 'data:test',
  SRI_DIGITAL_CERTIFICATE_PASSWORD: 'test',
  SRI_ESTABLISHMENT_CODE: '001',
  SRI_EMISSION_POINT_CODE: '001',
  SRI_TEST_ENVIRONMENT: 'true',
};

describe('Payment to Invoice (e2e)', () => {
  let app: INestApplication;
  let paymentFindFirstMock: ReturnType<typeof vi.fn>;
  let paymentUpdateMock: ReturnType<typeof vi.fn>;
  let orderFindUniqueMock: ReturnType<typeof vi.fn>;
  let invoiceFindUniqueMock: ReturnType<typeof vi.fn>;
  let invoiceCreateMock: ReturnType<typeof vi.fn>;
  let providerIssueInvoiceMock: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    paymentFindFirstMock = vi.fn();
    paymentUpdateMock = vi.fn();
    orderFindUniqueMock = vi.fn();
    invoiceFindUniqueMock = vi.fn();
    invoiceCreateMock = vi.fn();
    providerIssueInvoiceMock = vi.fn();

    const prismaMock = {
      payment: {
        findFirst: paymentFindFirstMock,
        findUnique: vi.fn().mockResolvedValue({
          id: 'pay_1',
          orderId: 'order_1',
          status: PaymentStatus.PENDING,
          metadata: {},
        }),
        update: paymentUpdateMock,
      },
      order: {
        findUnique: orderFindUniqueMock,
        update: vi.fn().mockResolvedValue({ id: 'order_1', status: 'PROCESSING' }),
      },
      invoice: {
        findUnique: invoiceFindUniqueMock,
        create: invoiceCreateMock,
      },
      inventory: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'inv_1',
          productId: 'SKU-001',
          variantId: null,
          quantity: 100,
          reservedQuantity: 1,
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      orderStatusHistory: {
        create: vi.fn(),
      },
      auditLog: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      },
      $transaction: vi.fn((arg: unknown) => {
        if (typeof arg === 'function') {
          return arg(prismaMock);
        }
        for (const op of arg as unknown[]) {
          void op;
        }
      }),
      $connect: vi.fn(),
      $disconnect: vi.fn(),
    };

    const configMock = new ConfigService(TEST_CONFIG);

    const stripeProviderMock = {
      validateWebhookSignature: vi.fn(() => true),
    };

    const invoiceProviderMock = {
      issueInvoice: providerIssueInvoiceMock,
      getInvoiceStatus: vi.fn(),
      issueCreditNote: vi.fn(),
    };

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(configMock)
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(StripeProvider)
      .useValue(stripeProviderMock)
      .overrideProvider(DirectSriInvoiceProvider)
      .useValue(invoiceProviderMock)
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

  afterAll(async () => {
    await app.close();
  });

  it('creates an invoice after a successful Stripe payment webhook', async () => {
    const orderId = 'order_1';
    const paymentId = 'pay_1';
    const providerTransactionId = 'pi_123';
    const accessKey = '1'.repeat(49);

    paymentFindFirstMock.mockResolvedValue({
      id: paymentId,
      orderId,
      status: PaymentStatus.PENDING,
      metadata: {},
    });

    paymentUpdateMock.mockResolvedValue({
      id: paymentId,
      orderId,
      status: PaymentStatus.COMPLETED,
      metadata: { paidAt: expect.any(String) },
    });

    orderFindUniqueMock.mockResolvedValue({
      id: orderId,
      orderNumber: 'ORD-001',
      customerEmail: 'customer@example.com',
      customerPhone: null,
      subtotal: 100,
      taxAmount: 15,
      discountAmount: 0,
      total: 115,
      items: [
        { name: 'Test product', sku: 'SKU-001', price: 100, quantity: 1 },
      ],
      payments: [{ id: paymentId }],
    });

    invoiceFindUniqueMock.mockResolvedValue(null);

    providerIssueInvoiceMock.mockResolvedValue({
      accessKey,
      status: InvoiceStatus.AUTHORIZED,
      authorizationNumber: '1234567890',
      xmlContent: '<xml></xml>',
      sriResponse: { autorizaciones: [{ estado: 'AUTORIZADO' }] },
    });

    invoiceCreateMock.mockResolvedValue({
      id: 'inv_1',
      orderId,
      documentType: '01',
      accessKey,
      authorizationNumber: '1234567890',
      status: InvoiceStatus.AUTHORIZED,
      xmlContent: '<xml></xml>',
      pdfUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const webhook = signStripeWebhook({
      type: 'payment_intent.succeeded',
      data: { object: { id: providerTransactionId } },
    });

    await request(app.getHttpServer())
      .post('/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .send(webhook.body)
      .set('stripe-signature', webhook.signature)
      .expect(200);

    expect(paymentFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { providerTransactionId },
      }),
    );

    expect(paymentUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: paymentId },
        data: expect.objectContaining({
          status: PaymentStatus.COMPLETED,
        }),
      }),
    );

    expect(invoiceCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId,
          status: InvoiceStatus.AUTHORIZED,
          accessKey,
        }),
      }),
    );
  });
});
