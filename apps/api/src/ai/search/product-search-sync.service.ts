import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { KnowledgeIndexingService } from '../knowledge/knowledge-indexing.service.js';
import { MeilisearchService } from './meilisearch.service.js';

@Injectable()
export class ProductSearchSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meilisearch: MeilisearchService,
    private readonly knowledgeIndexing: KnowledgeIndexingService,
  ) {}

  async syncProduct(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
      },
    });

    if (!product) {
      return;
    }

    await this.meilisearch.indexProduct({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description ?? '',
      status: product.status,
    });

    await this.knowledgeIndexing.indexProduct(productId);
  }

  async removeProduct(productId: string): Promise<void> {
    await this.meilisearch.deleteProduct(productId);
    await this.prisma.knowledgeChunk.deleteMany({
      where: { sourceType: 'PRODUCT', sourceId: productId },
    });
  }
}
