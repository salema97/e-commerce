import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import { KnowledgeIndexingService } from './knowledge-indexing.service.js';
import { KnowledgeIndexQueueLifecycle } from './knowledge-index-queue.lifecycle.js';
import {
  getKnowledgeIndexQueueConcurrency,
  isKnowledgeIndexQueueEnabled,
  KNOWLEDGE_INDEX_QUEUE_NAME,
} from './knowledge-index-queue.config.js';
import {
  KnowledgeIndexJobName,
  type DeleteSourceJobData,
  type IndexCmsPageJobData,
  type IndexFaqJobData,
  type IndexProductJobData,
} from './knowledge-index-queue.types.js';

@Injectable()
export class KnowledgeIndexQueueWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KnowledgeIndexQueueWorker.name);
  private worker: Worker | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly indexing: KnowledgeIndexingService,
    private readonly queueLifecycle: KnowledgeIndexQueueLifecycle,
  ) {}

  onModuleInit(): void {
    if (!isKnowledgeIndexQueueEnabled(this.config)) {
      this.logger.log('Knowledge index queue worker disabled');
      return;
    }

    this.worker = new Worker(
      KNOWLEDGE_INDEX_QUEUE_NAME,
      async (job) => {
        switch (job.name) {
          case KnowledgeIndexJobName.INDEX_FAQ:
            await this.indexing.indexFaq((job.data as IndexFaqJobData).faqId);
            break;
          case KnowledgeIndexJobName.INDEX_CMS_PAGE:
            await this.indexing.indexCmsPage((job.data as IndexCmsPageJobData).pageId);
            break;
          case KnowledgeIndexJobName.INDEX_PRODUCT:
            await this.indexing.indexProduct((job.data as IndexProductJobData).productId);
            break;
          case KnowledgeIndexJobName.DELETE_SOURCE: {
            const data = job.data as DeleteSourceJobData;
            await this.indexing.deleteSource(data.sourceType, data.sourceId);
            break;
          }
          default:
            this.logger.warn({ jobName: job.name }, 'Unknown knowledge index job');
        }
      },
      {
        connection: { url: this.config.getOrThrow<string>('REDIS_URL') },
        concurrency: getKnowledgeIndexQueueConcurrency(this.config),
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error({ jobId: job?.id, error }, 'Knowledge index job failed');
    });
  }

  async onModuleDestroy(): Promise<void> {
    void this.queueLifecycle;
    await this.worker?.close();
  }
}
