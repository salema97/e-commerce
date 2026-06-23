import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { InvoicesModule } from '../invoices.module.js';
import sriQueueConfig, { SRI_QUEUE_NAME } from './sri-queue.config.js';
import { SRI_QUEUE_TOKEN } from './sri-queue.tokens.js';
import { SriQueueService } from './sri-queue.service.js';
import { SriQueueWorker } from './sri-queue.worker.js';
import { SriReconciliationService } from './sri-reconciliation.service.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forFeature(sriQueueConfig),
    PrismaModule,
    forwardRef(() => InvoicesModule),
  ],
  providers: [
    SriQueueService,
    SriQueueWorker,
    SriReconciliationService,
    {
      provide: SRI_QUEUE_TOKEN,
      useFactory: (config: ConfigService) => {
        const maxRetries = config.get<number>('sriQueue.maxRetries', 5);
        const backoffDelay = config.get<number>(
          'sriQueue.backoffBaseDelayMs',
          2_000,
        );

        return new Queue(SRI_QUEUE_NAME, {
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
      },
      inject: [ConfigService],
    },
  ],
  exports: [SriQueueService, SriQueueWorker, SriReconciliationService],
})
export class SriQueueModule {}
