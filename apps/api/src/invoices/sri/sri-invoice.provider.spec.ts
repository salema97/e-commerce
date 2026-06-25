import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DirectSriInvoiceProvider } from './sri-invoice.provider.js';
import { SriAccessKeyBuilder } from './sri-access-key.builder.js';
import { SriXmlBuilder } from './sri-xml.builder.js';
import { SriCreditNoteXmlBuilder } from './sri-credit-note-xml.builder.js';
import { SriSignerService } from './sri-signer.service.js';
import { SriSoapClient } from './sri-soap.client.js';
import { InvoiceSequenceService } from '../invoice-sequence.service.js';
import { InvoiceStatus } from '../invoice-status.enum.js';
import { InvoiceOrder, CreditNoteInput } from '../invoice-provider.interface.js';

describe('DirectSriInvoiceProvider', () => {
  let provider: DirectSriInvoiceProvider;
  let soapClient: {
    submit: ReturnType<typeof vi.fn>;
    poll: ReturnType<typeof vi.fn>;
    queryStatus: ReturnType<typeof vi.fn>;
  };
  let signerService: { sign: ReturnType<typeof vi.fn>; loadCertificateFileAsBuffer: ReturnType<typeof vi.fn> };
  let invoiceSequenceService: { allocateNext: ReturnType<typeof vi.fn> };
  let prismaService: {
    returnRequest: { findUnique: ReturnType<typeof vi.fn> };
    creditNote: { create: ReturnType<typeof vi.fn> };
    returnRequestUpdate: ReturnType<typeof vi.fn>;
  };

  const order: InvoiceOrder = {
    orderId: 'order_1',
    orderNumber: 'ORD-001',
    customerName: 'John Doe',
    customerIdentification: '1710034065001',
    customerEmail: 'john@example.com',
    subtotal: 100,
    taxAmount: 15,
    discountAmount: 0,
    total: 115,
    currency: 'USD',
    items: [
      {
        code: 'SKU-001',
        description: 'Test product',
        quantity: 1,
        unitPrice: 100,
        discount: 0,
        taxRate: 15,
      },
    ],
  };

  const creditNoteInput: CreditNoteInput = {
    returnRequestId: 'return_1',
    invoiceAccessKey: '1'.repeat(49),
    parentInvoiceAccessKey: '1'.repeat(49),
    authorizationNumber: '1234567890',
    codDocModificado: '01',
    numDocModificado: '1'.repeat(49),
    fechaEmisionDocumentoModificado: '15/01/2024',
    reason: 'Customer return',
    items: [
      {
        code: 'SKU-001',
        description: 'Test product',
        quantity: 1,
        unitPrice: 100,
        discount: 0,
        taxRate: 15,
        reason: 'Customer return',
      },
    ],
    total: 100,
  };

  beforeEach(async () => {
    soapClient = {
      submit: vi.fn(),
      poll: vi.fn(),
      queryStatus: vi.fn(),
    };
    signerService = {
      sign: vi.fn((xml: string) => `signed_${xml}`),
      loadCertificateFileAsBuffer: vi.fn().mockResolvedValue(Buffer.from('test-p12')),
    };
    invoiceSequenceService = {
      allocateNext: vi.fn().mockResolvedValue('000000001'),
    };
    prismaService = {
      returnRequest: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'return_1',
          order: {
            customerEmail: 'customer@example.com',
            customerPhone: '0999999999',
          },
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      creditNote: {
        create: vi.fn().mockResolvedValue({ id: 'cn_1' }),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        DirectSriInvoiceProvider,
        SriAccessKeyBuilder,
        SriXmlBuilder,
        SriCreditNoteXmlBuilder,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              const values: Record<string, string> = {
                SRI_RUC: '1792146739001',
                SRI_ESTABLISHMENT_CODE: '001',
                SRI_EMISSION_POINT_CODE: '001',
                SRI_DIGITAL_CERTIFICATE_PATH: 'data:test',
                SRI_DIGITAL_CERTIFICATE_PASSWORD: 'test',
                SRI_COMPANY_NAME: 'Empresa E-commerce',
                SRI_COMPANY_TRADE_NAME: 'E-commerce',
                SRI_COMPANY_ADDRESS: 'Direccion matriz',
              };
              return values[key] ?? '';
            },
            get: (key: string) => {
              if (key === 'SRI_TEST_ENVIRONMENT') return 'true';
              return undefined;
            },
          },
        },
        { provide: SriSignerService, useValue: signerService },
        { provide: SriSoapClient, useValue: soapClient },
        { provide: InvoiceSequenceService, useValue: invoiceSequenceService },
        {
          provide: PrismaService,
          useValue: {
            returnRequest: prismaService.returnRequest,
            creditNote: prismaService.creditNote,
          },
        },
      ],
    }).compile();

    provider = module.get(DirectSriInvoiceProvider);
  });

  it('issues an invoice and returns AUTHORIZED when SRI accepts and authorizes', async () => {
    soapClient.submit.mockResolvedValue({ estado: 'RECIBIDA' });
    soapClient.poll.mockResolvedValue({
      autorizaciones: [
        {
          estado: 'AUTORIZADO',
          numeroAutorizacion: '1234567890',
          fechaAutorizacion: '2024-01-15T00:00:00',
          ambiente: '1',
        },
      ],
    });

    const result = await provider.issueInvoice(order);

    expect(result.accessKey).toHaveLength(49);
    expect(result.status).toBe(InvoiceStatus.AUTHORIZED);
    expect(result.authorizationNumber).toBe('1234567890');
    expect(result.xmlContent).toContain('signed_');
    expect(soapClient.submit).toHaveBeenCalledWith(
      expect.stringContaining('signed_'),
    );
    expect(invoiceSequenceService.allocateNext).toHaveBeenCalledWith(
      '01',
      '001',
      '001',
    );
  });

  it('returns REJECTED when reception fails', async () => {
    soapClient.submit.mockResolvedValue({
      estado: 'DEVUELTA',
      comprobantes: [{ claveAcceso: 'key', mensajes: [{ identificador: '1', mensaje: 'Error', tipo: 'ERROR' }] }],
    });

    const result = await provider.issueInvoice(order);

    expect(result.status).toBe(InvoiceStatus.REJECTED);
  });

  it('returns SUBMITTED when authorization is still pending after max retries', async () => {
    soapClient.submit.mockResolvedValue({ estado: 'RECIBIDA' });
    soapClient.poll.mockResolvedValue({
      autorizaciones: [{ estado: 'EN_PROCESO', numeroAutorizacion: '', fechaAutorizacion: '', ambiente: '1' }],
    });

    const result = await provider.issueInvoice(order);

    expect(result.status).toBe(InvoiceStatus.SUBMITTED);
  });

  it('queries invoice status as AUTHORIZED', async () => {
    soapClient.queryStatus.mockResolvedValue({
      autorizaciones: [{ estado: 'AUTORIZADO', numeroAutorizacion: '123', fechaAutorizacion: '', ambiente: '1' }],
    });

    const status = await provider.getInvoiceStatus('access_key_1');

    expect(status).toBe(InvoiceStatus.AUTHORIZED);
  });

  it('issues a credit note and returns AUTHORIZED when SRI accepts and authorizes', async () => {
    soapClient.submit.mockResolvedValue({ estado: 'RECIBIDA' });
    soapClient.poll.mockResolvedValue({
      autorizaciones: [
        {
          estado: 'AUTORIZADO',
          numeroAutorizacion: '1234567890',
          fechaAutorizacion: '2024-01-15T00:00:00',
          ambiente: '1',
        },
      ],
    });

    const result = await provider.issueCreditNote(creditNoteInput);

    expect(result.accessKey).toHaveLength(49);
    expect(result.status).toBe(InvoiceStatus.AUTHORIZED);
    expect(result.authorizationNumber).toBe('1234567890');
    expect(result.xmlContent).toContain('signed_');
    expect(invoiceSequenceService.allocateNext).toHaveBeenCalledWith(
      '04',
      '001',
      '001',
    );
    expect(prismaService.creditNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parentInvoiceAccessKey: '1'.repeat(49),
        }),
      }),
    );
  });

  it('returns REJECTED credit note when reception fails', async () => {
    soapClient.submit.mockResolvedValue({
      estado: 'DEVUELTA',
      comprobantes: [{ claveAcceso: 'key', mensajes: [{ identificador: '1', mensaje: 'Error', tipo: 'ERROR' }] }],
    });

    const result = await provider.issueCreditNote(creditNoteInput);

    expect(result.status).toBe(InvoiceStatus.REJECTED);
    expect(prismaService.creditNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parentInvoiceAccessKey: '1'.repeat(49),
        }),
      }),
    );
  });

  it('returns SUBMITTED credit note when authorization is still pending', async () => {
    soapClient.submit.mockResolvedValue({ estado: 'RECIBIDA' });
    soapClient.poll.mockResolvedValue({
      autorizaciones: [{ estado: 'EN_PROCESO', numeroAutorizacion: '', fechaAutorizacion: '', ambiente: '1' }],
    });

    const result = await provider.issueCreditNote(creditNoteInput);

    expect(result.status).toBe(InvoiceStatus.SUBMITTED);
    expect(prismaService.creditNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parentInvoiceAccessKey: '1'.repeat(49),
        }),
      }),
    );
  });
});
