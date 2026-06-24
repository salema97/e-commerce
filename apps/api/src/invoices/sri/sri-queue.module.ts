import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { InvoicesModule } from '../invoices.module.js';
import { EventBusModule } from '../../event-bus/event-bus.module.js';
import sriQueueConfig, {
  SRI_QUEUE_NAME,
  getSriQueueBackoffDelay,
  getSriQueueConcurrency,
  getSriQueueMaxRetries,
  isSriQueueEnabled,
} from './sri-queue.config.js';
import { SRI_QUEUE_TOKEN } from './sri-queue.tokens.js';
import { SriQueueService } from './sri-queue.service.js';
import { SriQueueWorker } from './sri-queue.worker.js';
import { SriReconciliationService } from './sri-reconciliation.service.js';

async function waitUntilReady(queue: Queue, timeoutMs: number): Promise<void> {
  await Promise.race([
    queue.waitUntilReady(),
    new Promise<void>((_, reject) => {
      setTimeout(
        () => reject(new Error(`SRI queue failed to connect to Redis within ${timeoutMs}ms`)),
        timeoutMs,
      );
    }),
  ]);
}

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forFeature(sriQueueConfig),
    PrismaModule,
    EventBusModule,
    forwardRef(() => InvoicesModule),
  ],
  providers: [
    SriQueueService,
    SriQueueWorker,
    SriReconciliationService,
    {
      provide: SRI_QUEUE_TOKEN,
      useFactory: async (config: ConfigService) => {
        const enabled = isSriQueueEnabled(config);
        const maxRetries = getSriQueueMaxRetries(config);
        const backoffDelay = getSriQueueBackoffDelay(config);

        const queue = new Queue(SRI_QUEUE_NAME, {
          connection: {
            url: config.getOrThrow<string>('REDIS_URL'),
          },
          defaultJobOptions: {
            attempts: maxRetries,
            backoff: {
              type: 'exponential',
              delay: backoffDelay,
            },
            removeOnComplete: 100,
            removeOnFail: 50,
          },
        });

        queue.on('error', (error: Error) => {
          // eslint-disable-next-line no-console
          console.error('SRI queue Redis error:', error.message);
        });

        if (enabled) {
          await waitUntilReady(queue, 5_000);
        }

        return queue;
      },
      inject: [ConfigService],
    },
  ],
  exports: [SriQueueService, SriQueueWorker, SriReconciliationService],
})
export class SriQueueModule {}
