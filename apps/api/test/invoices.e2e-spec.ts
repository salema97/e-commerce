import './env.js';
import { createE2eTestingModule } from './e2e-module.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { DirectSriInvoiceProvider } from '../src/invoices/sri/sri-invoice.provider.js';
import { InvoiceStatus } from '../src/invoices/invoice-status.enum.js';
import { BASE_TEST_CONFIG, bearerAuth } from './test-config.js';

const TEST_CONFIG = { ...BASE_TEST_CONFIG };

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

    const module = await createE2eTestingModule()
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
      .set(bearerAuth('user_admin', 'ADMIN'))
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
      .set(bearerAuth('user_admin', 'ADMIN'))
      .send({ orderId: 'order_2' })
      .expect(400);
  });
});
