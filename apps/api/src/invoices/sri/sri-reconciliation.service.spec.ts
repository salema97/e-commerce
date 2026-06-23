import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SriDocumentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SriQueueService } from './sri-queue.service.js';
import { SriReconciliationService } from './sri-reconciliation.service.js';

describe('SriReconciliationService', () => {
  let service: SriReconciliationService;
  let queueService: {
    addReconcileDocumentJob: ReturnType<typeof vi.fn>;
  };
  let prisma: {
    invoice: {
      findMany: ReturnType<typeof vi.fn>;
    };
    creditNote: {
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    queueService = {
      addReconcileDocumentJob: vi.fn().mockResolvedValue({}),
    };

    prisma = {
      invoice: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      creditNote: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        SriReconciliationService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'sriQueue.reconciliationWindowHours') return 1;
              return undefined;
            },
          },
        },
        { provide: PrismaService, useValue: prisma },
        { provide: SriQueueService, useValue: queueService },
      ],
    }).compile();

    service = module.get(SriReconciliationService);
  });

  it('finds stuck invoices and enqueues reconcile jobs', async () => {
    const stuckStatuses: SriDocumentStatus[] = ['PENDING', 'SUBMITTED', 'FAILED'];
    const invoice = {
      id: 'inv_1',
      accessKey: '1'.repeat(49),
      sriStatus: 'SUBMITTED' as SriDocumentStatus,
    };

    prisma.invoice.findMany = vi.fn().mockResolvedValue([invoice]);

    const result = await service.reconcileStuckDocuments();

    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          sriStatus: { in: stuckStatuses },
          updatedAt: expect.any(Object),
        }),
      }),
    );
    expect(queueService.addReconcileDocumentJob).toHaveBeenCalledWith(
      '01',
      'inv_1',
    );
    expect(result.invoices).toBe(1);
  });

  it('finds stuck credit notes and enqueues reconcile jobs', async () => {
    const creditNote = {
      id: 'cn_1',
      accessKey: '2'.repeat(49),
      sriStatus: 'FAILED' as SriDocumentStatus,
    };

    prisma.creditNote.findMany = vi.fn().mockResolvedValue([creditNote]);

    const result = await service.reconcileStuckDocuments();

    expect(queueService.addReconcileDocumentJob).toHaveBeenCalledWith(
      '04',
      'cn_1',
    );
    expect(result.creditNotes).toBe(1);
  });

  it('uses the provided olderThanHours override', async () => {
    await service.reconcileStuckDocuments(3);

    const calls = prisma.invoice.findMany.mock.calls as Array<[
      { where: { updatedAt: { lte: Date } } },
    ]>;
    const cutoff = calls[0][0].where.updatedAt.lte;
    const expectedCutoff = new Date(Date.now() - 3 * 60 * 60 * 1000);

    expect(Math.abs(cutoff.getTime() - expectedCutoff.getTime())).toBeLessThan(
      1000,
    );
  });

  it('continues when enqueue fails for one document', async () => {
    prisma.invoice.findMany = vi
      .fn()
      .mockResolvedValue([
        { id: 'inv_1', accessKey: '1'.repeat(49), sriStatus: 'SUBMITTED' },
        { id: 'inv_2', accessKey: '2'.repeat(49), sriStatus: 'SUBMITTED' },
      ]);
    queueService.addReconcileDocumentJob
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('Queue down'));

    const result = await service.reconcileStuckDocuments();

    expect(result.invoices).toBe(2);
    expect(queueService.addReconcileDocumentJob).toHaveBeenCalledTimes(2);
  });
});
