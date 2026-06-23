import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { Prisma, SriDocumentJob, SriDocumentJobStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SRI_QUEUE_TOKEN } from './sri-queue.tokens.js';
import { SRI_QUEUE_NAME } from './sri-queue.config.js';
import {
  IssueCreditNoteJobData,
  IssueInvoiceJobData,
  ReconcileDocumentJobData,
  SriJobName,
} from './sri-queue.types.js';

@Injectable()
export class SriQueueService {
  private readonly logger = new Logger(SriQueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(SRI_QUEUE_TOKEN) private readonly queue: Queue,
  ) {}

  get isEnabled(): boolean {
    return this.config.get<boolean>('sriQueue.enabled', true);
  }

  async addIssueInvoiceJob(orderId: string): Promise<SriDocumentJob> {
    return this.enqueue(
      SriJobName.ISSUE_INVOICE,
      { orderId },
      '01',
      orderId,
    );
  }

  async addIssueCreditNoteJob(creditNoteId: string): Promise<SriDocumentJob> {
    return this.enqueue(
      SriJobName.ISSUE_CREDIT_NOTE,
      { creditNoteId },
      '04',
      creditNoteId,
    );
  }

  async addReconcileDocumentJob(
    documentType: string,
    documentId: string,
  ): Promise<SriDocumentJob> {
    return this.enqueue(
      SriJobName.RECONCILE_DOCUMENT,
      { documentType, documentId },
      documentType,
      documentId,
    );
  }

  private async enqueue(
    name: SriJobName,
    payload: Prisma.InputJsonValue,
    documentType: string,
    documentId: string,
  ): Promise<SriDocumentJob> {
    if (!this.isEnabled) {
      this.logger.warn(
        { name, documentType, documentId },
        'SRI queue is disabled; skipping job enqueue',
      );
      throw new Error('SRI queue is disabled');
    }

    const maxAttempts = this.config.get<number>('sriQueue.maxRetries', 5);

    const job = await this.queue.add(name, payload, {
      jobId: `${SRI_QUEUE_NAME}:${name}:${documentType}:${documentId}`,
      attempts: maxAttempts,
    });

    const record = await this.prisma.sriDocumentJob.upsert({
      where: { jobId: job.id ?? `${name}:${documentId}` },
      create: {
        jobId: job.id ?? `${name}:${documentId}`,
        documentType,
        documentId,
        status: SriDocumentJobStatus.PENDING,
        maxAttempts,
        payload,
      },
      update: {
        status: SriDocumentJobStatus.PENDING,
        attempts: 0,
        lastError: null,
        payload,
      },
    });

    this.logger.log(
      {
        jobId: record.jobId,
        name,
        documentType,
        documentId,
      },
      'SRI document job enqueued',
    );

    return record;
  }
}
