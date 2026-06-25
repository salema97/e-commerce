import './env.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { createHmac } from 'crypto';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { StripeProvider } from '../src/payments/stripe/stripe.provider.js';
import { SriQueueService } from '../src/invoices/sri/sri-queue.service.js';
import { SriDocumentStorageService } from '../src/invoices/sri/sri-document-storage.service.js';
import { DirectSriInvoiceProvider } from '../src/invoices/sri/sri-invoice.provider.js';
import { PaymentStatus } from '../src/payments/entities/payment-status.enum.js';
import { InvoiceStatus } from '../src/invoices/invoice-status.enum.js';
import { BASE_TEST_CONFIG, bearerAuth } from './test-config.js';

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
  ...BASE_TEST_CONFIG,
  STRIPE_WEBHOOK_SECRET: TEST_STRIPE_WEBHOOK_SECRET,
  SRI_COMPANY_NAME: 'Empresa E-commerce',
  SRI_COMPANY_TRADE_NAME: 'E-commerce',
  SRI_COMPANY_ADDRESS: 'Direccion matriz',
};

const SIGNED_XML_URL = 'https://signed.example.com/invoices/inv_1.xml?sig=abc';
const SIGNED_PDF_URL = 'https://signed.example.com/invoices/inv_1.pdf?sig=def';

describe('SRI invoice flow (e2e)', () => {
  let app: INestApplication;
  let paymentFindFirstMock: ReturnType<typeof vi.fn>;
  let paymentUpdateMock: ReturnType<typeof vi.fn>;
  let orderFindUniqueMock: ReturnType<typeof vi.fn>;
  let invoiceFindUniqueMock: ReturnType<typeof vi.fn>;
  let invoiceUpdateMock: ReturnType<typeof vi.fn>;
  let addIssueInvoiceJobMock: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    paymentFindFirstMock = vi.fn();
    paymentUpdateMock = vi.fn();
    orderFindUniqueMock = vi.fn();
    invoiceFindUniqueMock = vi.fn();
    invoiceUpdateMock = vi.fn();
    addIssueInvoiceJobMock = vi.fn().mockResolvedValue({
      id: 'job_record_1',
      jobId: 'sri-documents:issue-invoice:01:order_flow_1',
      documentType: '01',
      documentId: 'order_flow_1',
      status: 'PENDING',
      attempts: 0,
      maxAttempts: 5,
      payload: { orderId: 'order_flow_1' },
      lastError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const prismaMock = {
      payment: {
        findFirst: paymentFindFirstMock,
        findUnique: vi.fn().mockResolvedValue({
          id: 'pay_flow_1',
          orderId: 'order_flow_1',
          status: PaymentStatus.PENDING,
          metadata: {},
        }),
        update: paymentUpdateMock,
      },
      order: {
        findUnique: orderFindUniqueMock,
        update: vi.fn().mockResolvedValue({ id: 'order_flow_1', status: 'PROCESSING' }),
      },
      invoice: {
        findUnique: invoiceFindUniqueMock,
        update: invoiceUpdateMock,
      },
      inventory: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'inv_stock_1',
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

    const stripeProviderMock = {
      validateWebhookSignature: vi.fn(() => true),
    };

    const sriQueueMock = {
      addIssueInvoiceJob: addIssueInvoiceJobMock,
      addIssueCreditNoteJob: vi.fn(),
      addReconcileDocumentJob: vi.fn(),
      isEnabled: false,
    };

    const documentStorageMock = {
      getInvoiceSignedUrls: vi.fn().mockResolvedValue({
        xmlUrl: SIGNED_XML_URL,
        pdfUrl: SIGNED_PDF_URL,
      }),
      getCreditNoteSignedUrls: vi.fn(),
      storeAuthorizedInvoice: vi.fn(),
      storeAuthorizedCreditNote: vi.fn(),
    };

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(new ConfigService(TEST_CONFIG))
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(StripeProvider)
      .useValue(stripeProviderMock)
      .overrideProvider(SriQueueService)
      .useValue(sriQueueMock)
      .overrideProvider(SriDocumentStorageService)
      .useValue(documentStorageMock)
      .overrideProvider(DirectSriInvoiceProvider)
      .useValue({
        issueInvoice: vi.fn(),
        issueCreditNote: vi.fn(),
        getInvoiceStatus: vi.fn(),
      })
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useBodyParser('json', {
      verify: (req: { rawBody?: Buffer }, _res: unknown, buf: Buffer) => {
        req.rawBody = buf;
      },
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('enqueues an SRI job after Stripe payment webhook and persists queue metadata', async () => {
    const orderId = 'order_flow_1';
    const paymentId = 'pay_flow_1';
    const providerTransactionId = 'pi_flow_123';

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
      metadata: { paidAt: new Date().toISOString() },
    });

    orderFindUniqueMock.mockResolvedValue({
      id: orderId,
      orderNumber: 'ORD-FLOW-001',
      customerEmail: 'customer@example.com',
      customerPhone: null,
      subtotal: 100,
      taxAmount: 15,
      discountAmount: 0,
      total: 115,
      items: [{ name: 'Test product', sku: 'SKU-001', price: 100, quantity: 1 }],
      payments: [{ id: paymentId }],
    });

    invoiceFindUniqueMock.mockResolvedValue(null);

    const webhook = signStripeWebhook({
      type: 'payment_intent.succeeded',
      data: { object: { id: providerTransactionId } },
    });

    await request(app.getHttpServer())
      .post('/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', webhook.signature)
      .send(webhook.body)
      .expect(200);

    expect(addIssueInvoiceJobMock).toHaveBeenCalledWith(orderId);

    const jobRecord = await addIssueInvoiceJobMock.mock.results[0]?.value;
    expect(jobRecord).toMatchObject({
      documentType: '01',
      documentId: orderId,
      status: 'PENDING',
    });
  });

  it('allows admin to retry a failed invoice and re-enqueues the SRI job', async () => {
    const invoiceId = 'inv_flow_1';
    const orderId = 'order_flow_1';
    const accessKey = '1'.repeat(49);

    invoiceFindUniqueMock.mockResolvedValue({
      id: invoiceId,
      orderId,
      documentType: '01',
      accessKey,
      authorizationNumber: null,
      status: InvoiceStatus.FAILED,
      retryCount: 2,
      lastError: 'SRI timeout',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    invoiceUpdateMock.mockResolvedValue({
      id: invoiceId,
      orderId,
      documentType: '01',
      accessKey,
      authorizationNumber: null,
      status: InvoiceStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app.getHttpServer())
      .post(`/v1/invoices/${invoiceId}/retry`)
      .set(bearerAuth('user_admin', 'ADMIN'))
      .expect(201);

    expect(response.body.status).toBe(InvoiceStatus.DRAFT);
    expect(addIssueInvoiceJobMock).toHaveBeenCalledWith(orderId);
    expect(invoiceUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: invoiceId },
        data: expect.objectContaining({
          status: InvoiceStatus.DRAFT,
          retryCount: 0,
          lastError: null,
        }),
      }),
    );
  });

  it('redirects admin download endpoints to time-limited signed URLs', async () => {
    const invoiceId = 'inv_flow_1';
    const accessKey = '1'.repeat(49);

    invoiceFindUniqueMock.mockResolvedValue({
      id: invoiceId,
      orderId: 'order_flow_1',
      documentType: '01',
      accessKey,
      authorizationNumber: '1234567890',
      status: InvoiceStatus.AUTHORIZED,
      xmlKey: 'sri/invoices/inv_flow_1/invoice.xml',
      pdfKey: 'sri/invoices/inv_flow_1/ride.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
      order: {
        id: 'order_flow_1',
        orderNumber: 'ORD-FLOW-001',
        user: { id: 'user_admin' },
      },
    });

    const xmlResponse = await request(app.getHttpServer())
      .get(`/v1/invoices/${invoiceId}/xml`)
      .set(bearerAuth('user_admin', 'ADMIN'))
      .expect(HttpStatus.FOUND);

    expect(xmlResponse.headers.location).toBe(SIGNED_XML_URL);

    const pdfResponse = await request(app.getHttpServer())
      .get(`/v1/invoices/${invoiceId}/pdf`)
      .set(bearerAuth('user_admin', 'ADMIN'))
      .expect(HttpStatus.FOUND);

    expect(pdfResponse.headers.location).toBe(SIGNED_PDF_URL);
  });
});
