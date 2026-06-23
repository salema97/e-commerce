import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import type { KnowledgeSourceType } from '@prisma/client';
import { KnowledgeIndexingService } from './knowledge-indexing.service.js';
import { KNOWLEDGE_INDEX_QUEUE_TOKEN } from './knowledge-index-queue.tokens.js';
import {
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
export class KnowledgeIndexQueueService {
  private readonly logger = new Logger(KnowledgeIndexQueueService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly indexing: KnowledgeIndexingService,
    @Inject(KNOWLEDGE_INDEX_QUEUE_TOKEN) private readonly queue: Queue,
  ) {}

  get isEnabled(): boolean {
    return isKnowledgeIndexQueueEnabled(this.config);
  }

  async enqueueFaq(faqId: string): Promise<void> {
    await this.enqueueOrRun(
      KnowledgeIndexJobName.INDEX_FAQ,
      { faqId },
      `faq:${faqId}`,
      () => this.indexing.indexFaq(faqId),
    );
  }

  async enqueueCmsPage(pageId: string): Promise<void> {
    await this.enqueueOrRun(
      KnowledgeIndexJobName.INDEX_CMS_PAGE,
      { pageId },
      `cms:${pageId}`,
      () => this.indexing.indexCmsPage(pageId),
    );
  }

  async enqueueProduct(productId: string): Promise<void> {
    await this.enqueueOrRun(
      KnowledgeIndexJobName.INDEX_PRODUCT,
      { productId },
      `product:${productId}`,
      () => this.indexing.indexProduct(productId),
    );
  }

  async enqueueDeleteSource(sourceType: KnowledgeSourceType, sourceId: string): Promise<void> {
    await this.enqueueOrRun(
      KnowledgeIndexJobName.DELETE_SOURCE,
      { sourceType, sourceId },
      `delete:${sourceType}:${sourceId}`,
      async () => {
        await this.indexing.deleteSource(sourceType, sourceId);
      },
    );
  }

  private async enqueueOrRun(
    name: KnowledgeIndexJobName,
    payload: IndexFaqJobData | IndexCmsPageJobData | IndexProductJobData | DeleteSourceJobData,
    jobId: string,
    fallback: () => Promise<void>,
  ): Promise<void> {
    if (!this.isEnabled) {
      await fallback();
      return;
    }

    try {
      await this.queue.add(name, payload, {
        jobId: `${KNOWLEDGE_INDEX_QUEUE_NAME}:${jobId}`,
        removeOnComplete: 100,
        removeOnFail: 50,
      });
    } catch (error) {
      this.logger.warn({ error, name, jobId }, 'Knowledge index enqueue failed; running inline');
      await fallback();
    }
  }
}
