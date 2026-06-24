import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RagService } from '../rag/rag.service.js';
import { MeilisearchService } from './meilisearch.service.js';
import { isSemanticSearchEnabled } from './search.config.js';

export interface SearchResultItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  score: number;
}

@Injectable()
export class HybridSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly meilisearch: MeilisearchService,
    private readonly ragService: RagService,
  ) {}

  async search(query: string, limit = 20): Promise<SearchResultItem[]> {
    const keywordHits = await this.meilisearch.searchKeyword(query, limit);
    const keywordMap = new Map(
      keywordHits.map((hit, index) => [hit.id, 1 - index / Math.max(keywordHits.length, 1)]),
    );

    if (!isSemanticSearchEnabled(this.config, this.meilisearch.isEnabled)) {
      return this.mapKeywordOnly(keywordHits);
    }

    const semanticChunks = await this.ragService.retrieve(query, 10);
    const productIds = semanticChunks
      .filter((chunk) => chunk.content.length > 0)
      .map((chunk) => chunk.id);

    const semanticProducts = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { id: { in: productIds } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
    });

    const merged = new Map<string, SearchResultItem>();

    for (const hit of keywordHits) {
      merged.set(hit.id, {
        id: hit.id,
        name: hit.name,
        slug: hit.slug,
        description: hit.description,
        score: keywordMap.get(hit.id) ?? 0.5,
      });
    }

    for (const product of semanticProducts) {
      const semanticScore =
        semanticChunks.find((chunk) => chunk.content.includes(product.name))?.score ?? 0.4;
      const keywordScore = keywordMap.get(product.id) ?? 0;
      const existing = merged.get(product.id);
      const combined = Math.max(existing?.score ?? 0, keywordScore * 0.6 + semanticScore * 0.4);

      merged.set(product.id, {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        score: combined,
      });
    }

    return [...merged.values()].sort((left, right) => right.score - left.score).slice(0, limit);
  }

  private mapKeywordOnly(
    keywordHits: Array<{ id: string; name: string; slug: string; description: string }>,
  ): SearchResultItem[] {
    return keywordHits.map((hit, index) => ({
      id: hit.id,
      name: hit.name,
      slug: hit.slug,
      description: hit.description,
      score: 1 - index / Math.max(keywordHits.length, 1),
    }));
  }
}
