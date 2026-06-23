import './env.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { createHmac } from 'crypto';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { RedisService } from '../src/common/redis/redis.service.js';
import { StripeProvider } from '../src/payments/stripe/stripe.provider.js';
import { SriQueueService } from '../src/invoices/sri/sri-queue.service.js';
import { PaymentStatus } from '../src/payments/entities/payment-status.enum.js';

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

describe('Stripe Webhook (e2e)', () => {
  let app: INestApplication;
  let paymentUpdateMock: ReturnType<typeof vi.fn>;
  let orderStatusHistoryCreateMock: ReturnType<typeof vi.fn>;
  let paymentFindFirstMock: ReturnType<typeof vi.fn>;
  let orderFindUniqueMock: ReturnType<typeof vi.fn>;
  let invoiceFindUniqueMock: ReturnType<typeof vi.fn>;
  let addIssueInvoiceJobMock: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    paymentFindFirstMock = vi.fn();
    paymentUpdateMock = vi.fn();
    orderStatusHistoryCreateMock = vi.fn();
    orderFindUniqueMock = vi.fn();
    invoiceFindUniqueMock = vi.fn();
    addIssueInvoiceJobMock = vi.fn().mockResolvedValue({
      id: 'job_1',
      jobId: 'sri-documents:issue-invoice:01:order_1',
      documentType: '01',
      documentId: 'order_1',
      status: 'PENDING',
      attempts: 0,
      maxAttempts: 5,
      payload: { orderId: 'order_1' },
      lastError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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
        create: orderStatusHistoryCreateMock,
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

    const configMock = new ConfigService({
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
    });

    const stripeProviderMock = {
      validateWebhookSignature: vi.fn((payload: Buffer, signature: string) =>
        signature.includes('badsignature') ? false : true,
      ),
    };

    const sriQueueMock = {
      addIssueInvoiceJob: addIssueInvoiceJobMock,
      addIssueCreditNoteJob: vi.fn(),
      addReconcileDocumentJob: vi.fn(),
    };

    const redisServiceMock = {
      client: { status: 'end' },
      onModuleDestroy: vi.fn(),
    };

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(configMock)
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(RedisService)
      .useValue(redisServiceMock)
      .overrideProvider(StripeProvider)
      .useValue(stripeProviderMock)
      .overrideProvider(SriQueueService)
      .useValue(sriQueueMock)
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

  it('returns 401 for invalid signature', () => {
    return request(app.getHttpServer())
      .post('/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .send('{"type":"payment_intent.succeeded"}')
      .set('stripe-signature', 't=123,v1=badsignature')
      .expect(401);
  });

  it('updates payment status and enqueues an SRI invoice job for payment_intent.succeeded', async () => {
    paymentFindFirstMock.mockResolvedValue({
      id: 'pay_1',
      orderId: 'order_1',
      status: PaymentStatus.PENDING,
      metadata: {},
    });
    paymentUpdateMock.mockResolvedValue({
      id: 'pay_1',
      status: PaymentStatus.COMPLETED,
    });
    orderFindUniqueMock.mockResolvedValue({
      id: 'order_1',
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
      payments: [{ id: 'pay_1' }],
    });
    invoiceFindUniqueMock.mockResolvedValue(null);

    const webhook = signStripeWebhook({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123' } },
    });

    await request(app.getHttpServer())
      .post('/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .send(webhook.body)
      .set('stripe-signature', webhook.signature)
      .expect(200);

    expect(paymentFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { providerTransactionId: 'pi_123' } }),
    );
    expect(paymentUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay_1' },
        data: expect.objectContaining({ status: PaymentStatus.COMPLETED }),
      }),
    );
    expect(orderStatusHistoryCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ orderId: 'order_1' }),
      }),
    );
    expect(addIssueInvoiceJobMock).toHaveBeenCalledWith('order_1');
  });
});
