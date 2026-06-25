import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { SriDocumentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SriQueueService } from './sri-queue.service.js';

@Injectable()
export class SriReconciliationService implements OnModuleInit {
  private readonly logger = new Logger(SriReconciliationService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly queueService: SriQueueService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    const cronExpression = this.config.get<string>(
      'SRI_RECONCILIATION_CRON',
      '0 * * * *',
    );

    const job = new CronJob(cronExpression, () => {
      void this.reconcileStuckDocuments().catch((error: unknown) => {
        this.logger.error({ error }, 'SRI reconciliation cron failed');
      });
    });

    this.schedulerRegistry.addCronJob('sri-reconciliation', job);
    job.start();
  }

  async reconcileStuckDocuments(olderThanHours?: number): Promise<{
    invoices: number;
    creditNotes: number;
  }> {
    const hours =
      olderThanHours ??
      this.config.get<number>('sriQueue.reconciliationWindowHours', 1);
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const stuckStatuses: SriDocumentStatus[] = [
      'PENDING',
      'SUBMITTED',
      'FAILED',
    ];

    const [invoices, creditNotes] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          sriStatus: { in: stuckStatuses },
          updatedAt: { lte: cutoff },
        },
        select: { id: true, accessKey: true, sriStatus: true },
      }),
      this.prisma.creditNote.findMany({
        where: {
          sriStatus: { in: stuckStatuses },
          updatedAt: { lte: cutoff },
        },
        select: { id: true, accessKey: true, sriStatus: true },
      }),
    ]);

    for (const invoice of invoices) {
      try {
        await this.queueService.addReconcileDocumentJob('01', invoice.id);
        this.logger.log(
          { invoiceId: invoice.id, accessKey: invoice.accessKey },
          'Reconciled stuck invoice',
        );
      } catch (error) {
        this.logger.error(
          { invoiceId: invoice.id, error },
          'Failed to enqueue invoice reconciliation',
        );
      }
    }

    for (const creditNote of creditNotes) {
      try {
        await this.queueService.addReconcileDocumentJob('04', creditNote.id);
        this.logger.log(
          { creditNoteId: creditNote.id, accessKey: creditNote.accessKey },
          'Reconciled stuck credit note',
        );
      } catch (error) {
        this.logger.error(
          { creditNoteId: creditNote.id, error },
          'Failed to enqueue credit note reconciliation',
        );
      }
    }

    return {
      invoices: invoices.length,
      creditNotes: creditNotes.length,
    };
  }
}