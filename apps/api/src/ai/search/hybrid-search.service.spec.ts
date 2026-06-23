import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HybridSearchService } from './hybrid-search.service.js';
import { MeilisearchService } from './meilisearch.service.js';
import { RagService } from '../rag/rag.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';

describe('HybridSearchService', () => {
  let service: HybridSearchService;
  const searchKeyword = vi.fn();
  const retrieve = vi.fn();
  const findMany = vi.fn();

  beforeEach(() => {
    searchKeyword.mockReset();
    retrieve.mockReset();
    findMany.mockReset();

    searchKeyword.mockResolvedValue([
      { id: 'p1', name: 'Zapatos', slug: 'zapatos', description: 'Running shoes' },
      { id: 'p2', name: 'Camiseta', slug: 'camiseta', description: 'Cotton tee' },
    ]);

    const meilisearch = { searchKeyword } as unknown as MeilisearchService;
    const ragService = { retrieve } as unknown as RagService;
    const prisma = { product: { findMany } } as unknown as PrismaService;
    const config = {
      get: (key: string) => (key === 'SEMANTIC_SEARCH_ENABLED' ? 'false' : undefined),
    } as unknown as ConfigService;

    service = new HybridSearchService(prisma, config, meilisearch, ragService);
  });

  it('returns keyword hits when semantic search is disabled', async () => {
    const results = await service.search('zapatos', 10);
    expect(results).toHaveLength(2);
    expect(results[0]?.id).toBe('p1');
    expect(retrieve).not.toHaveBeenCalled();
  });
});
