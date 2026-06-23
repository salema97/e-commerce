import { registerAs } from '@nestjs/config';
import type { ConfigService } from '@nestjs/config';

export const SRI_QUEUE_NAME = 'sri-documents';

export default registerAs('sriQueue', () => ({
  queueName: SRI_QUEUE_NAME,
  redisUrl: process.env.REDIS_URL,
  enabled: process.env.SRI_QUEUE_ENABLED !== 'false',
  concurrency: Number.parseInt(process.env.SRI_WORKER_CONCURRENCY ?? '5', 10),
  maxRetries: Number.parseInt(process.env.SRI_MAX_RETRIES ?? '5', 10),
  backoffBaseDelayMs: 2_000,
  reconciliationCron: process.env.SRI_RECONCILIATION_CRON ?? '0 * * * *',
  reconciliationWindowHours: 1,
}));

export function isSriQueueEnabled(config: ConfigService): boolean {
  const explicit = config.get<string>('SRI_QUEUE_ENABLED');
  if (explicit !== undefined) {
    return explicit !== 'false';
  }
  return config.get<boolean>('sriQueue.enabled', true);
}

export function getSriQueueMaxRetries(config: ConfigService): number {
  const explicit = config.get<string>('SRI_MAX_RETRIES');
  if (explicit !== undefined) {
    return Number.parseInt(explicit, 10);
  }
  return config.get<number>('sriQueue.maxRetries', 5);
}

export function getSriQueueConcurrency(config: ConfigService): number {
  const explicit = config.get<string>('SRI_WORKER_CONCURRENCY');
  if (explicit !== undefined) {
    return Number.parseInt(explicit, 10);
  }
  return config.get<number>('sriQueue.concurrency', 5);
}

export function getSriQueueBackoffDelay(config: ConfigService): number {
  return config.get<number>('sriQueue.backoffBaseDelayMs', 2_000);
}
