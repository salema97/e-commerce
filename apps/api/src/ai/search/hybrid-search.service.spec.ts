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
      get: (key: string) => {
        if (key === 'SEMANTIC_SEARCH_ENABLED') return 'false';
        return undefined;
      },
    } as unknown as ConfigService;

    service = new HybridSearchService(prisma, config, meilisearch, ragService);
  });

  it('returns keyword hits when semantic search is disabled', async () => {
    const results = await service.search('zapatos', 10);
    expect(results).toHaveLength(2);
    expect(results[0]?.id).toBe('p1');
    expect(retrieve).not.toHaveBeenCalled();
  });

  it('uses semantic merge when auto mode and Meilisearch is enabled', async () => {
    retrieve.mockResolvedValue([{ id: 'chunk-1', content: 'Zapatos running', score: 0.9 }]);
    findMany.mockResolvedValue([
      {
        id: 'p9',
        name: 'Zapatos Pro',
        slug: 'zapatos-pro',
        description: 'Running',
      },
    ]);

    const meilisearch = { searchKeyword, isEnabled: true } as unknown as MeilisearchService;
    const ragService = { retrieve } as unknown as RagService;
    const prisma = { product: { findMany } } as unknown as PrismaService;
    const config = {
      get: (key: string) => (key === 'SEMANTIC_SEARCH_ENABLED' ? 'auto' : undefined),
    } as unknown as ConfigService;

    const semanticService = new HybridSearchService(prisma, config, meilisearch, ragService);
    const results = await semanticService.search('zapatos running', 10);

    expect(retrieve).toHaveBeenCalled();
    expect(results.some((item) => item.id === 'p1' || item.id === 'p9')).toBe(true);
  });
});
