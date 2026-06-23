import { ConfigService } from '@nestjs/config';

export const KNOWLEDGE_INDEX_QUEUE_NAME = 'knowledge-index';

export function isKnowledgeIndexQueueEnabled(config: ConfigService): boolean {
  return config.get<string>('KNOWLEDGE_INDEX_QUEUE_ENABLED', 'true') === 'true';
}

export function getKnowledgeIndexQueueConcurrency(config: ConfigService): number {
  return Number(config.get<string>('KNOWLEDGE_INDEX_QUEUE_CONCURRENCY', '3'));
}
