import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { SriDocumentJobStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SriQueueService } from './sri-queue.service.js';
import { SRI_QUEUE_TOKEN } from './sri-queue.tokens.js';
import { SriJobName } from './sri-queue.types.js';

describe('SriQueueService', () => {
  let service: SriQueueService;
  let queue: {
    add: ReturnType<typeof vi.fn>;
  };
  let prisma: {
    sriDocumentJob: {
      upsert: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    queue = {
      add: vi.fn().mockResolvedValue({ id: 'bullmq-job-id' }),
      getJob: vi.fn().mockResolvedValue(null),
    };

    prisma = {
      sriDocumentJob: {
        upsert: vi.fn().mockResolvedValue({
          id: 'record-id',
          jobId: 'bullmq-job-id',
          status: SriDocumentJobStatus.PENDING,
        }),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        SriQueueService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'sriQueue.enabled') return true;
              if (key === 'sriQueue.maxRetries') return 5;
              return undefined;
            },
          },
        },
        { provide: PrismaService, useValue: prisma },
        { provide: SRI_QUEUE_TOKEN, useValue: queue as unknown as Queue },
      ],
    }).compile();

    service = module.get(SriQueueService);
  });

  it('adds an invoice job and persists a PENDING record', async () => {
    const record = await service.addIssueInvoiceJob('order_1');

    expect(queue.add).toHaveBeenCalledWith(
      SriJobName.ISSUE_INVOICE,
      { orderId: 'order_1' },
      expect.objectContaining({ attempts: 5 }),
    );
    expect(prisma.sriDocumentJob.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { jobId: expect.any(String) },
        create: expect.objectContaining({
          documentType: '01',
          documentId: 'order_1',
          status: SriDocumentJobStatus.PENDING,
        }),
      }),
    );
    expect(record.status).toBe(SriDocumentJobStatus.PENDING);
  });

  it('adds a credit note job and persists a PENDING record', async () => {
    const record = await service.addIssueCreditNoteJob('cn_1');

    expect(queue.add).toHaveBeenCalledWith(
      SriJobName.ISSUE_CREDIT_NOTE,
      { creditNoteId: 'cn_1' },
      expect.objectContaining({ attempts: 5 }),
    );
    expect(prisma.sriDocumentJob.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          documentType: '04',
          documentId: 'cn_1',
        }),
      }),
    );
    expect(record.status).toBe(SriDocumentJobStatus.PENDING);
  });

  it('adds a reconcile document job', async () => {
    const record = await service.addReconcileDocumentJob('01', 'inv_1');

    expect(queue.add).toHaveBeenCalledWith(
      SriJobName.RECONCILE_DOCUMENT,
      { documentType: '01', documentId: 'inv_1' },
      expect.objectContaining({ attempts: 5 }),
    );
    expect(record.status).toBe(SriDocumentJobStatus.PENDING);
  });

  it('throws when the queue is disabled', async () => {
    vi.spyOn(service, 'isEnabled', 'get').mockReturnValue(false);

    await expect(service.addIssueInvoiceJob('order_1')).rejects.toThrow(
      'SRI queue is disabled',
    );
  });
});
