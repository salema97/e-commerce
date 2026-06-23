import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { KnowledgeIndexQueueService } from '../knowledge/knowledge-index-queue.service.js';
import { MeilisearchService } from './meilisearch.service.js';

@Injectable()
export class ProductSearchSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meilisearch: MeilisearchService,
    private readonly knowledgeIndexQueue: KnowledgeIndexQueueService,
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

    await this.knowledgeIndexQueue.enqueueProduct(productId);
  }

  async removeProduct(productId: string): Promise<void> {
    await this.meilisearch.deleteProduct(productId);
    await this.knowledgeIndexQueue.enqueueDeleteSource('PRODUCT', productId);
  }
}
