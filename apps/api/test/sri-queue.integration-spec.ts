import './env.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SriQueueModule } from '../src/invoices/sri/sri-queue.module.js';
import { SriQueueService } from '../src/invoices/sri/sri-queue.service.js';
import { SriQueueWorker } from '../src/invoices/sri/sri-queue.worker.js';
import { SRI_QUEUE_TOKEN } from '../src/invoices/sri/sri-queue.tokens.js';
import { SRI_QUEUE_NAME } from '../src/invoices/sri/sri-queue.config.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { InvoicesModule } from '../src/invoices/invoices.module.js';
import { DirectSriInvoiceProvider } from '../src/invoices/sri/sri-invoice.provider.js';
import { InvoiceProviderFactory } from '../src/invoices/invoice-provider.factory.js';

@Module({})
class DummyInvoicesModule {}

describe('SriQueueModule integration', () => {
  let service: SriQueueService;
  let prismaMock: ReturnType<typeof buildPrismaMock>;
  let queueMock: { add: ReturnType<typeof vi.fn> };

  function buildPrismaMock() {
    return {
      sriDocumentJob: {
        upsert: vi.fn().mockResolvedValue({
          id: 'job_record_1',
          jobId: `${SRI_QUEUE_NAME}:issue-invoice:01:order_1`,
          documentType: '01',
          documentId: 'order_1',
          status: 'PENDING',
          attempts: 0,
          maxAttempts: 5,
          payload: { orderId: 'order_1' },
          lastError: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
    };
  }

  beforeAll(async () => {
    prismaMock = buildPrismaMock();

    const providerFactoryMock = {
      getProvider: vi.fn().mockReturnValue({
        issueInvoice: vi.fn(),
        issueCreditNote: vi.fn(),
        getInvoiceStatus: vi.fn(),
      }),
    };

    const invoiceProviderMock = {
      issueInvoice: vi.fn(),
      issueCreditNote: vi.fn(),
      getInvoiceStatus: vi.fn(),
    };

    queueMock = {
      add: vi.fn().mockResolvedValue({
        id: `${SRI_QUEUE_NAME}:issue-invoice:01:order_1`,
      }),
    };

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
          ignoreEnvFile: true,
        }),
        SriQueueModule,
      ],
    })
      .overrideModule(InvoicesModule)
      .useModule(DummyInvoicesModule)
      .overrideProvider(ConfigService)
      .useValue(
        new ConfigService({
          NODE_ENV: 'test',
          REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
          SRI_QUEUE_ENABLED: 'true',
          SRI_MAX_RETRIES: '5',
          SRI_RECONCILIATION_CRON: '0 * * * *',
        }),
      )
      .overrideProvider(PrismaService)
      .useValue(prismaMock as never)
      .overrideProvider(InvoiceProviderFactory)
      .useValue(providerFactoryMock)
      .overrideProvider(DirectSriInvoiceProvider)
      .useValue(invoiceProviderMock)
      .overrideProvider(SriQueueWorker)
      .useValue({ onModuleInit: vi.fn(), onModuleDestroy: vi.fn() })
      .overrideProvider(SRI_QUEUE_TOKEN)
      .useValue(queueMock)
      .compile();

    service = module.get(SriQueueService);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('enqueues an invoice job and persists a PENDING SriDocumentJob record', async () => {
    const record = await service.addIssueInvoiceJob('order_1');

    expect(record).toMatchObject({
      documentType: '01',
      documentId: 'order_1',
      status: 'PENDING',
    });

    expect(queueMock.add).toHaveBeenCalledWith(
      'issue-invoice',
      { orderId: 'order_1' },
      expect.objectContaining({
        jobId: `${SRI_QUEUE_NAME}:issue-invoice:01:order_1`,
        attempts: 5,
      }),
    );

    expect(prismaMock.sriDocumentJob.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { jobId: `${SRI_QUEUE_NAME}:issue-invoice:01:order_1` },
        create: expect.objectContaining({
          documentType: '01',
          documentId: 'order_1',
          status: 'PENDING',
        }),
        update: expect.objectContaining({
          status: 'PENDING',
        }),
      }),
    );
  });
});
