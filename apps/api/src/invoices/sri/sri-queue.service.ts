import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job, Queue } from 'bullmq';
import { Prisma, SriDocumentJob, SriDocumentJobStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SRI_QUEUE_TOKEN } from './sri-queue.tokens.js';
import { SriQueueLifecycle } from './sri-queue.lifecycle.js';
import { SriReconciliationService } from './sri-reconciliation.service.js';
import {
  SRI_QUEUE_NAME,
  getSriQueueMaxRetries,
  isSriQueueEnabled,
} from './sri-queue.config.js';
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
    private readonly queueLifecycle: SriQueueLifecycle,
    private readonly reconciliationService: SriReconciliationService,
  ) {}

  get isEnabled(): boolean {
    void this.reconciliationService;
    return isSriQueueEnabled(this.config);
  }

  addIssueInvoiceJob(orderId: string): Promise<SriDocumentJob> {
    return this.enqueue(
      SriJobName.ISSUE_INVOICE,
      { orderId },
      '01',
      orderId,
    );
  }

  addIssueCreditNoteJob(creditNoteId: string): Promise<SriDocumentJob> {
    return this.enqueue(
      SriJobName.ISSUE_CREDIT_NOTE,
      { creditNoteId },
      '04',
      creditNoteId,
    );
  }

  addReconcileDocumentJob(
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

    const maxAttempts = getSriQueueMaxRetries(this.config);
    const jobId = `${SRI_QUEUE_NAME}:${name}:${documentType}:${documentId}`;

    const existingJob = await this.queue.getJob(jobId);

    if (existingJob && (await existingJob.isFailed())) {
      await existingJob.retry();

      const record = await this.prisma.sriDocumentJob.update({
        where: { jobId },
        data: {
          status: SriDocumentJobStatus.PENDING,
          attempts: 0,
          lastError: null,
          payload,
        },
      });

      this.logger.log(
        { jobId: record.jobId, name, documentType, documentId },
        'SRI document job retry enqueued from failed state',
      );

      return record;
    }

    const job = await this.queue.add(name, payload, {
      jobId,
      attempts: maxAttempts,
    });

    const record = await this.prisma.sriDocumentJob.upsert({
      where: { jobId: job.id ?? jobId },
      create: {
        jobId: job.id ?? jobId,
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
