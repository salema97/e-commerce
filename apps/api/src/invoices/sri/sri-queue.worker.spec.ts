import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import {
  InvoiceStatus,
  SriDocumentJobStatus,
  CreditNoteStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { InvoiceSequenceService } from '../invoice-sequence.service.js';
import { SriAccessKeyBuilder } from './sri-access-key.builder.js';
import { SriXmlBuilder } from './sri-xml.builder.js';
import { SriCreditNoteXmlBuilder } from './sri-credit-note-xml.builder.js';
import { SriSignerService } from './sri-signer.service.js';
import { SriSoapClient } from './sri-soap.client.js';
import { SriRidePdfService } from './sri-ride-pdf.service.js';
import { SriDocumentStorageService } from './sri-document-storage.service.js';
import { SriDeliveryService } from './sri-delivery.service.js';
import { EventBus } from '../../event-bus/event-bus.interface.js';
import { SriQueueWorker } from './sri-queue.worker.js';

vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation(function () {
    this.on = vi.fn();
    this.close = vi.fn().mockResolvedValue(undefined);
  }),
}));

function createJob(data: unknown, id = 'job-1', attemptsMade = 0, attempts = 5): Job {
  return {
    id,
    name: 'issue-invoice',
    data,
    attemptsMade,
    opts: { attempts },
  } as unknown as Job;
}

describe('SriQueueWorker', () => {
  let worker: SriQueueWorker;
  let prisma: {
    sriDocumentJob: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    order: {
      findUnique: ReturnType<typeof vi.fn>;
    };
    invoice: {
      upsert: ReturnType<typeof vi.fn>;
    };
    creditNote: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let sequenceService: { allocateNext: ReturnType<typeof vi.fn> };
  let accessKeyBuilder: { build: ReturnType<typeof vi.fn> };
  let xmlBuilder: { buildFactura: ReturnType<typeof vi.fn> };
  let creditNoteXmlBuilder: { buildNotaDeCredito: ReturnType<typeof vi.fn> };
  let signerService: {
    loadCertificateFileAsBuffer: ReturnType<typeof vi.fn>;
    sign: ReturnType<typeof vi.fn>;
  };
  let soapClient: {
    submit: ReturnType<typeof vi.fn>;
    poll: ReturnType<typeof vi.fn>;
    queryStatus: ReturnType<typeof vi.fn>;
  };
  let ridePdfService: {
    generateFromAuthorizedXml: ReturnType<typeof vi.fn>;
  };
  let documentStorageService: {
    uploadInvoiceDocuments: ReturnType<typeof vi.fn>;
    uploadCreditNoteDocuments: ReturnType<typeof vi.fn>;
  };
  let deliveryService: {
    deliverInvoice: ReturnType<typeof vi.fn>;
    deliverCreditNote: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    prisma = {
      sriDocumentJob: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'record-1',
          documentType: '01',
          documentId: 'order_1',
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'order_1',
          orderNumber: 'ORD-001',
          customerEmail: 'customer@example.com',
          customerPhone: '0999999999',
          subtotal: 100,
          taxAmount: 15,
          discountAmount: 0,
          total: 115,
          items: [
            {
              id: 'item-1',
              name: 'Product',
              sku: 'SKU-001',
              price: { toNumber: () => 100 },
              quantity: 1,
            },
          ],
        }),
      },
    invoice: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({ id: 'inv-1', orderId: 'order_1' }),
      update: vi.fn().mockResolvedValue({}),
    },
      creditNote: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({ id: 'cn_1' }),
      },
    };

    sequenceService = {
      allocateNext: vi.fn().mockResolvedValue('000000001'),
    };

    accessKeyBuilder = {
      build: vi.fn().mockReturnValue('1'.repeat(49)),
    };

    xmlBuilder = {
      buildFactura: vi.fn().mockReturnValue('<xml/>'),
    };

    creditNoteXmlBuilder = {
      buildNotaDeCredito: vi.fn().mockReturnValue('<xml/>'),
    };

    signerService = {
      loadCertificateFileAsBuffer: vi.fn().mockResolvedValue(Buffer.from('p12')),
      sign: vi.fn().mockReturnValue('signed_xml'),
    };

    soapClient = {
      submit: vi.fn().mockResolvedValue({ estado: 'RECIBIDA' }),
      poll: vi.fn().mockResolvedValue({
        autorizaciones: [
          {
            estado: 'AUTORIZADO',
            numeroAutorizacion: '1234567890',
            fechaAutorizacion: '2024-01-15T00:00:00',
          },
        ],
      }),
      queryStatus: vi.fn().mockResolvedValue({
        autorizaciones: [{ estado: 'AUTORIZADO' }],
      }),
    };

    ridePdfService = {
      generateFromAuthorizedXml: vi.fn().mockResolvedValue(Buffer.from('pdf')),
    };

    documentStorageService = {
      uploadInvoiceDocuments: vi.fn().mockResolvedValue({
        xmlUrl: 'https://public.example.com/xml',
        pdfUrl: 'https://public.example.com/pdf',
        xmlKey: 'xml-key',
        pdfKey: 'pdf-key',
      }),
      uploadCreditNoteDocuments: vi.fn().mockResolvedValue({
        xmlUrl: 'https://public.example.com/cn-xml',
        pdfUrl: 'https://public.example.com/cn-pdf',
        xmlKey: 'cn-xml-key',
        pdfKey: 'cn-pdf-key',
      }),
    };

    deliveryService = {
      deliverInvoice: vi.fn().mockResolvedValue(undefined),
      deliverCreditNote: vi.fn().mockResolvedValue(undefined),
    };

    const eventBusMock = { publish: vi.fn(), registerHandler: vi.fn() };

    const module = await Test.createTestingModule({
      providers: [
        SriQueueWorker,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              const values: Record<string, string> = {
                REDIS_URL: 'redis://localhost:6379',
                SRI_ESTABLISHMENT_CODE: '001',
                SRI_EMISSION_POINT_CODE: '001',
                SRI_RUC: '1792146739001',
                SRI_DIGITAL_CERTIFICATE_PATH: 'data:test',
                SRI_DIGITAL_CERTIFICATE_PASSWORD: 'test',
                SRI_COMPANY_NAME: 'Empresa',
                SRI_COMPANY_TRADE_NAME: 'E-commerce',
                SRI_COMPANY_ADDRESS: 'Direccion',
              };
              return values[key] ?? '';
            },
            get: (key: string) => {
              if (key === 'SRI_TEST_ENVIRONMENT') return 'true';
              if (key === 'sriQueue.concurrency') return 5;
              if (key === 'sriQueue.enabled') return true;
              return undefined;
            },
          },
        },
        { provide: PrismaService, useValue: prisma },
        { provide: InvoiceSequenceService, useValue: sequenceService },
        { provide: SriAccessKeyBuilder, useValue: accessKeyBuilder },
        { provide: SriXmlBuilder, useValue: xmlBuilder },
        { provide: SriCreditNoteXmlBuilder, useValue: creditNoteXmlBuilder },
        { provide: SriSignerService, useValue: signerService },
        { provide: SriSoapClient, useValue: soapClient },
        { provide: SriRidePdfService, useValue: ridePdfService },
        { provide: SriDocumentStorageService, useValue: documentStorageService },
        { provide: SriDeliveryService, useValue: deliveryService },
        { provide: EventBus, useValue: eventBusMock },
      ],
    }).compile();

    worker = module.get(SriQueueWorker);
  });

  it('creates a BullMQ Worker on module init', () => {
    worker.onModuleInit();

    expect(Worker).toHaveBeenCalledWith(
      'sri-documents',
      expect.any(Function),
      expect.objectContaining({ concurrency: 5 }),
    );
  });

  it('processes an invoice job and stores AUTHORIZED status', async () => {
    const job = createJob({ orderId: 'order_1' });
    await (worker as unknown as { process: (job: Job) => Promise<void> }).process(job);

    expect(prisma.sriDocumentJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: SriDocumentJobStatus.RUNNING },
      }),
    );
    expect(soapClient.submit).toHaveBeenCalledWith('signed_xml');
    expect(prisma.invoice.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          orderId: 'order_1',
          status: InvoiceStatus.PENDING,
          sriStatus: 'PENDING',
          sequenceNumber: '000000001',
        }),
      }),
    );
    expect(prisma.invoice.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          orderId: 'order_1',
          status: InvoiceStatus.AUTHORIZED,
          authorizationNumber: '1234567890',
        }),
      }),
    );
    expect(ridePdfService.generateFromAuthorizedXml).toHaveBeenCalledWith(
      'signed_xml',
      '1234567890',
      expect.any(Date),
    );
    expect(documentStorageService.uploadInvoiceDocuments).toHaveBeenCalledWith(
      'inv-1',
      'signed_xml',
      Buffer.from('pdf'),
    );
    expect(deliveryService.deliverInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'inv-1', orderId: 'order_1' }),
      expect.objectContaining({ id: 'order_1' }),
    );
    expect(prisma.sriDocumentJob.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: { status: SriDocumentJobStatus.COMPLETED },
      }),
    );
  });

  it('marks job as FAILED on transient error and allows BullMQ retry', async () => {
    soapClient.submit.mockRejectedValue(new Error('SRI timeout'));
    const job = createJob({ orderId: 'order_1' }, 'job-1', 0, 5);

    await expect(
      (worker as unknown as { process: (job: Job) => Promise<void> }).process(job),
    ).rejects.toThrow('SRI timeout');

    expect(prisma.sriDocumentJob.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: SriDocumentJobStatus.FAILED,
          attempts: 1,
          lastError: 'SRI timeout',
        }),
      }),
    );
  });

  it('reuses existing sequence and access key on retry', async () => {
    prisma.invoice.findUnique = vi.fn().mockResolvedValue({
      id: 'inv-1',
      orderId: 'order_1',
      accessKey: 'existing-access-key',
      sequenceNumber: '000000042',
      status: InvoiceStatus.PENDING,
    });

    const job = createJob({ orderId: 'order_1' });
    await (worker as unknown as { process: (job: Job) => Promise<void> }).process(job);

    expect(sequenceService.allocateNext).not.toHaveBeenCalled();
    expect(accessKeyBuilder.build).not.toHaveBeenCalled();
    expect(prisma.invoice.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          accessKey: 'existing-access-key',
          sequenceNumber: '000000042',
          status: InvoiceStatus.PENDING,
        }),
      }),
    );
    expect(prisma.invoice.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          status: InvoiceStatus.AUTHORIZED,
        }),
      }),
    );
  });

  it('moves job to DLQ on final attempt failure', async () => {
    soapClient.submit.mockRejectedValue(new Error('SRI down'));
    const job = createJob({ orderId: 'order_1' }, 'job-1', 4, 5);

    await expect(
      (worker as unknown as { process: (job: Job) => Promise<void> }).process(job),
    ).rejects.toThrow('SRI down');

    expect(prisma.sriDocumentJob.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: SriDocumentJobStatus.DLQ,
          attempts: 5,
          lastError: 'SRI down',
        }),
      }),
    );
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'alert.sri_dlq' }),
    );
  });

  it('processes a credit note job and updates the existing record', async () => {
    prisma.creditNote.findUnique = vi.fn().mockResolvedValue({
      id: 'cn_1',
      totalAmount: { toNumber: () => 100 },
      returnRequest: {
        id: 'return_1',
        reason: 'Customer return',
        order: {
          id: 'order_1',
          customerEmail: 'customer@example.com',
          customerPhone: '0999999999',
          invoice: {
            accessKey: '1'.repeat(49),
            authorizationNumber: '123',
            createdAt: new Date('2024-01-15'),
          },
          items: [
            {
              productId: 'p1',
              variantId: null,
              name: 'Product',
              sku: 'SKU-001',
              price: { toNumber: () => 100 },
            },
          ],
        },
        items: [
          {
            productId: 'p1',
            productVariantId: null,
            quantity: 1,
            refundValue: null,
          },
        ],
      },
    });

    prisma.sriDocumentJob.findUnique = vi.fn().mockResolvedValue({
      id: 'record-1',
      documentType: '04',
      documentId: 'cn_1',
    });

    const job = createJob({ creditNoteId: 'cn_1' });
    (job as unknown as { name: string }).name = 'issue-credit-note';
    await (worker as unknown as { process: (job: Job) => Promise<void> }).process(job);

    expect(prisma.creditNote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cn_1' },
        data: expect.objectContaining({
          status: CreditNoteStatus.PENDING,
          sriStatus: 'PENDING',
          sequenceNumber: '000000001',
        }),
      }),
    );
    expect(prisma.creditNote.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 'cn_1' },
        data: expect.objectContaining({
          status: CreditNoteStatus.AUTHORIZED,
          authorizationNumber: '1234567890',
        }),
      }),
    );
    expect(documentStorageService.uploadCreditNoteDocuments).toHaveBeenCalledWith(
      'cn_1',
      'signed_xml',
      Buffer.from('pdf'),
    );
    expect(deliveryService.deliverCreditNote).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'cn_1' }),
      expect.objectContaining({ id: 'order_1' }),
    );
  });

  it('reconciles a document by querying SRI status', async () => {
    prisma.sriDocumentJob.findUnique = vi.fn().mockResolvedValue({
      id: 'record-1',
      documentType: '01',
      documentId: 'inv_1',
    });

    prisma.invoice.findUnique = vi.fn().mockResolvedValue({
      id: 'inv_1',
      accessKey: '1'.repeat(49),
    });

    const job = createJob({ documentType: '01', documentId: 'inv_1' });
    (job as unknown as { name: string }).name = 'reconcile-document';
    await (worker as unknown as { process: (job: Job) => Promise<void> }).process(job);

    expect(soapClient.queryStatus).toHaveBeenCalledWith('1'.repeat(49));
    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv_1' },
        data: expect.objectContaining({ status: InvoiceStatus.AUTHORIZED }),
      }),
    );
  });
});
