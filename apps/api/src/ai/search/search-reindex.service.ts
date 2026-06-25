import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MeilisearchService } from './meilisearch.service.js';
import {
  mapProductToMeiliDocument,
  productIndexSelect,
} from './meili-product.mapper.js';

@Injectable()
export class SearchReindexService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MeilisearchService) private readonly meilisearch: MeilisearchService,
  ) {}

  async reindexAll(): Promise<{ indexed: number; meilisearchEnabled: boolean }> {
    if (!this.meilisearch.isEnabled) {
      return { indexed: 0, meilisearchEnabled: false };
    }

    const products = await this.prisma.product.findMany({ select: productIndexSelect });
    const documents = products.map(mapProductToMeiliDocument);
    const indexed = await this.meilisearch.replaceAllDocuments(documents);
    return { indexed, meilisearchEnabled: true };
  }
}
