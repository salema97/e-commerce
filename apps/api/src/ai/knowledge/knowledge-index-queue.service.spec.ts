import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { KnowledgeIndexQueueService } from './knowledge-index-queue.service.js';

describe('KnowledgeIndexQueueService', () => {
  let service: KnowledgeIndexQueueService;
  const indexFaq = vi.fn();
  const queueAdd = vi.fn();

  beforeEach(() => {
    indexFaq.mockReset();
    queueAdd.mockReset();
    queueAdd.mockResolvedValue({ id: 'job-1' });

    const indexing = { indexFaq, indexCmsPage: vi.fn(), indexProduct: vi.fn(), deleteSource: vi.fn() };
    const config = {
      get: (key: string, defaultValue?: string) => {
        if (key === 'KNOWLEDGE_INDEX_QUEUE_ENABLED') return 'false';
        return defaultValue;
      },
    } as unknown as ConfigService;
    const queue = { add: queueAdd };

    service = new KnowledgeIndexQueueService(config, indexing as never, queue as never);
  });

  it('runs indexing inline when queue is disabled', async () => {
    await service.enqueueFaq('faq-1');
    expect(indexFaq).toHaveBeenCalledWith('faq-1');
    expect(queueAdd).not.toHaveBeenCalled();
  });
});
