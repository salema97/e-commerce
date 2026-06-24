import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Meilisearch } from 'meilisearch';

export interface MeiliProductDocument {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
}

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name);
  private client: Meilisearch | null = null;
  private readonly indexName = 'products';

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const host = this.config.get<string>('MEILI_HOST');
    if (!host) {
      this.logger.warn('MEILI_HOST not set; search indexing disabled');
      return;
    }

    this.client = new Meilisearch({
      host,
      apiKey: this.config.get<string>('MEILI_API_KEY'),
    });

    try {
      await this.client.createIndex(this.indexName, { primaryKey: 'id' });
      await this.client.index(this.indexName).updateSearchableAttributes(['name', 'description']);
    } catch {
      // Index may already exist.
    }
  }

  get isEnabled(): boolean {
    return this.client !== null;
  }

  async indexProduct(doc: MeiliProductDocument): Promise<void> {
    if (!this.client || doc.status !== 'ACTIVE') {
      if (this.client && doc.status !== 'ACTIVE') {
        await this.deleteProduct(doc.id);
      }
      return;
    }

    await this.client.index(this.indexName).addDocuments([doc]);
  }

  async deleteProduct(productId: string): Promise<void> {
    if (!this.client) {
      return;
    }
    await this.client.index(this.indexName).deleteDocument(productId);
  }

  async searchKeyword(query: string, limit = 20): Promise<MeiliProductDocument[]> {
    if (!this.client || !query.trim()) {
      return [];
    }

    const result = await this.client.index(this.indexName).search<MeiliProductDocument>(query, {
      limit,
    });
    return result.hits;
  }
}
