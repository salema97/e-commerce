import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { KNOWLEDGE_INDEX_QUEUE_TOKEN } from './knowledge-index-queue.tokens.js';

@Injectable()
export class KnowledgeIndexQueueLifecycle implements OnModuleDestroy {
  constructor(@Inject(KNOWLEDGE_INDEX_QUEUE_TOKEN) private readonly queue: Queue) {}

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
