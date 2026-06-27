import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { SRI_QUEUE_TOKEN } from './sri-queue.tokens.js';

@Injectable()
export class SriQueueLifecycle implements OnModuleDestroy {
  constructor(@Inject(SRI_QUEUE_TOKEN) private readonly queue: Queue) {}

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
