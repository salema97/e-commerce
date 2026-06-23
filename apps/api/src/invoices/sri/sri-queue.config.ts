import { registerAs } from '@nestjs/config';

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
