import './env.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { DirectSriInvoiceProvider } from '../src/invoices/sri/sri-invoice.provider.js';
import { InvoiceStatus } from '../src/invoices/invoice-status.enum.js';

vi.mock('@clerk/backend', async () => {
  const actual = await vi.importActual('@clerk/backend');
  return {
    ...(actual as object),
    verifyToken: vi.fn(() =>
      Promise.resolve({
        sub: 'user_admin',
        public_metadata: { role: 'ADMIN' },
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
  SRI_MODE: 'direct',
  SRI_RUC: '1792146739001',
  SRI_SOL_KEY: 'test',
  SRI_DIGITAL_CERTIFICATE_PATH: 'data:test',
  SRI_DIGITAL_CERTIFICATE_PASSWORD: 'test',
  SRI_ESTABLISHMENT_CODE: '001',
  SRI_EMISSION_POINT_CODE: '001',
  SRI_TEST_ENVIRONMENT: 'true',
};

describe('InvoicesController (e2e)', () => {
  let app: INestApplication;
  let invoiceCreateMock: ReturnType<typeof vi.fn>;
  let orderFindUniqueMock: ReturnType<typeof vi.fn>;
  let invoiceFindUniqueMock: ReturnType<typeof vi.fn>;
  let providerIssueInvoiceMock: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    invoiceCreateMock = vi.fn();
    orderFindUniqueMock = vi.fn();
    invoiceFindUniqueMock = vi.fn();
    providerIssueInvoiceMock = vi.fn();

    const prismaMock = {
      order: {
        findUnique: orderFindUniqueMock,
      },
      invoice: {
        findUnique: invoiceFindUniqueMock,
        create: invoiceCreateMock,
      },
      $connect: vi.fn(),
      $disconnect: vi.fn(),
    };

    const configMock = new ConfigService(TEST_CONFIG);

    const providerMock = {
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
      .overrideProvider(DirectSriInvoiceProvider)
      .useValue(providerMock)
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 without authorization', () => {
    return request(app.getHttpServer())
      .post('/v1/invoices')
      .send({ orderId: 'order_1' })
      .expect(401);
  });

  it('issues an invoice for an admin user', async () => {
    const accessKey = '1'.repeat(49);

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
    });
    invoiceFindUniqueMock.mockResolvedValue(null);
    providerIssueInvoiceMock.mockResolvedValue({
      accessKey,
      status: InvoiceStatus.AUTHORIZED,
      authorizationNumber: '1234567890',
      xmlContent: '<xml></xml>',
    });
    invoiceCreateMock.mockResolvedValue({
      id: 'inv_1',
      orderId: 'order_1',
      documentType: '01',
      accessKey,
      authorizationNumber: '1234567890',
      status: InvoiceStatus.AUTHORIZED,
      xmlContent: '<xml></xml>',
      pdfUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app.getHttpServer())
      .post('/v1/invoices')
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ orderId: 'order_1' })
      .expect(201);

    expect(response.body.status).toBe(InvoiceStatus.AUTHORIZED);
    expect(response.body.accessKey).toHaveLength(49);
    expect(invoiceCreateMock).toHaveBeenCalled();
  });

  it('returns 400 when invoice already exists for order', async () => {
    orderFindUniqueMock.mockResolvedValue({ id: 'order_2' });
    invoiceFindUniqueMock.mockResolvedValue({ id: 'inv_existing' });

    await request(app.getHttpServer())
      .post('/v1/invoices')
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ orderId: 'order_2' })
      .expect(400);
  });
});
