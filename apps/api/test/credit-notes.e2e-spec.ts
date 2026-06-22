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
import { CreditNoteStatus } from '@prisma/client';

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

describe('CreditNotesController (e2e)', () => {
  let app: INestApplication;
  let returnRequestFindUniqueMock: ReturnType<typeof vi.fn>;
  let creditNoteFindFirstMock: ReturnType<typeof vi.fn>;
  let creditNoteCreateMock: ReturnType<typeof vi.fn>;
  let creditNoteFindUniqueOrThrowMock: ReturnType<typeof vi.fn>;
  let returnRequestUpdateMock: ReturnType<typeof vi.fn>;
  let providerIssueCreditNoteMock: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    returnRequestFindUniqueMock = vi.fn();
    creditNoteFindFirstMock = vi.fn();
    creditNoteCreateMock = vi.fn();
    creditNoteFindUniqueOrThrowMock = vi.fn();
    returnRequestUpdateMock = vi.fn();
    providerIssueCreditNoteMock = vi.fn();

    const prismaMock = {
      returnRequest: {
        findUnique: returnRequestFindUniqueMock,
        update: returnRequestUpdateMock,
      },
      creditNote: {
        findFirst: creditNoteFindFirstMock,
        create: creditNoteCreateMock,
        findUniqueOrThrow: creditNoteFindUniqueOrThrowMock,
      },
      $connect: vi.fn(),
      $disconnect: vi.fn(),
    };

    const configMock = new ConfigService(TEST_CONFIG);

    const providerMock = {
      issueInvoice: vi.fn(),
      getInvoiceStatus: vi.fn(),
      issueCreditNote: providerIssueCreditNoteMock,
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
      .post('/v1/invoices/credit-notes')
      .send({ returnRequestId: 'return_1' })
      .expect(401);
  });

  it('issues a credit note for an admin user', async () => {
    const accessKey = '1'.repeat(49);

    returnRequestFindUniqueMock.mockResolvedValue({
      id: 'return_1',
      status: 'RESOLVED',
      reason: 'Customer return',
      order: {
        id: 'order_1',
        customerEmail: 'customer@example.com',
        customerPhone: null,
        items: [
          { productId: 'prod_1', variantId: null, name: 'Test product', sku: 'SKU-001', price: 100 },
        ],
        invoice: {
          accessKey: '1'.repeat(49),
          authorizationNumber: '1234567890',
          createdAt: new Date(),
        },
      },
      items: [
        { productId: 'prod_1', productVariantId: null, quantity: 1, refundValue: null },
      ],
    });
    creditNoteFindFirstMock.mockResolvedValue(null);
    providerIssueCreditNoteMock.mockResolvedValue({
      accessKey,
      status: InvoiceStatus.AUTHORIZED,
      authorizationNumber: '1234567890',
      xmlContent: '<xml></xml>',
    });
    creditNoteCreateMock.mockResolvedValue({
      id: 'cn_1',
      accessKey,
      status: CreditNoteStatus.AUTHORIZED,
      totalAmount: 100,
      xmlContent: '<xml></xml>',
      authorizationNumber: '1234567890',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    creditNoteFindUniqueOrThrowMock.mockResolvedValue({
      id: 'cn_1',
      accessKey,
      status: CreditNoteStatus.AUTHORIZED,
      totalAmount: 100,
      xmlContent: '<xml></xml>',
      authorizationNumber: '1234567890',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app.getHttpServer())
      .post('/v1/invoices/credit-notes')
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ returnRequestId: 'return_1' })
      .expect(201);

    expect(response.body.status).toBe(CreditNoteStatus.AUTHORIZED);
    expect(response.body.accessKey).toHaveLength(49);
    expect(providerIssueCreditNoteMock).toHaveBeenCalled();
  });

  it('returns 400 when return request is not resolved', async () => {
    returnRequestFindUniqueMock.mockResolvedValue({
      id: 'return_2',
      status: 'APPROVED',
      order: {
        id: 'order_2',
        customerEmail: 'customer@example.com',
        items: [],
        invoice: {
          accessKey: '1'.repeat(49),
          authorizationNumber: '1234567890',
          createdAt: new Date(),
        },
      },
      items: [],
    });

    await request(app.getHttpServer())
      .post('/v1/invoices/credit-notes')
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ returnRequestId: 'return_2' })
      .expect(400);
  });

  it('returns 400 when no invoice exists for the order', async () => {
    returnRequestFindUniqueMock.mockResolvedValue({
      id: 'return_3',
      status: 'RESOLVED',
      order: {
        id: 'order_3',
        customerEmail: 'customer@example.com',
        items: [],
        invoice: null,
      },
      items: [],
    });

    await request(app.getHttpServer())
      .post('/v1/invoices/credit-notes')
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ returnRequestId: 'return_3' })
      .expect(400);
  });
});
