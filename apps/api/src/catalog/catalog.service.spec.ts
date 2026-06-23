import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CatalogService } from './catalog.service.js';
import { MeilisearchService } from '../ai/search/meilisearch.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('CatalogService', () => {
  let service: CatalogService;
  const searchCatalog = vi.fn();
  const findMany = vi.fn();
  const count = vi.fn();

  beforeEach(() => {
    searchCatalog.mockReset();
    findMany.mockReset();
    count.mockReset();

    const meilisearch = { searchCatalog } as unknown as MeilisearchService;
    const prisma = {
      product: { findMany, count },
    } as unknown as PrismaService;
    const cache = {
      buildKey: () => 'k',
      get: async () => null,
      set: async () => undefined,
    } as unknown as import('./catalog-cache.service.js').CatalogCacheService;

    service = new CatalogService(prisma, meilisearch, cache);
  });

  it('returns Meilisearch catalog when search engine is enabled', async () => {
    searchCatalog.mockResolvedValue({
      hits: [
        {
          id: 'p1',
          name: 'Zapatos',
          slug: 'zapatos',
          description: 'Test',
          status: 'ACTIVE',
          price: 10,
          compareAtPrice: null,
          categoryId: 'c1',
          categorySlug: 'calzado',
          categoryName: 'Calzado',
          isFeatured: false,
          inStock: true,
          supplierName: null,
          brand: 'Nike',
          attributeFacets: [],
          imageUrl: null,
          createdAt: Date.now(),
        },
      ],
      total: 1,
      page: 1,
      limit: 24,
      facets: { categorySlug: { calzado: 1 } },
    });

    const result = await service.browse({ category: 'calzado' });
    expect(result.items).toHaveLength(1);
    expect(result.facets.categorySlug?.[0]?.value).toBe('calzado');
    expect(findMany).not.toHaveBeenCalled();
  });

  it('falls back to Prisma when Meilisearch is disabled', async () => {
    searchCatalog.mockResolvedValue(null);
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);

    const result = await service.browse({ q: 'zapatos' });
    expect(result.items).toEqual([]);
    expect(findMany).toHaveBeenCalled();
  });
});
