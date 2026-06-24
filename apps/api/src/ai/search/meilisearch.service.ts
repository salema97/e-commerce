import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Meilisearch } from 'meilisearch';

export interface MeiliProductDocument {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  price: number;
  compareAtPrice: number | null;
  categoryId: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  isFeatured: boolean;
  inStock: boolean;
  supplierName: string | null;
  brand: string | null;
  attributeFacets: string[];
  imageUrl: string | null;
  createdAt: number;
  averageRating: number | null;
  reviewCount: number;
}

export interface CatalogSearchParams {
  query?: string;
  categorySlug?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  attributes?: Record<string, string>;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
  page?: number;
  limit?: number;
}

export interface CatalogSearchResult {
  hits: MeiliProductDocument[];
  total: number;
  page: number;
  limit: number;
  facets: Record<string, Record<string, number>>;
}

const DEFAULT_SYNONYMS: Record<string, string[]> = {
  celular: ['móvil', 'telefono', 'smartphone'],
  móvil: ['celular', 'telefono'],
  telefono: ['celular', 'móvil'],
  zapatos: ['calzado'],
  calzado: ['zapatos'],
};

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name);
  private client: Meilisearch | null = null;
  private readonly indexName = 'products';
  private settingsApplied = false;

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
    } catch {
      // Index may already exist.
    }

    await this.applyIndexSettings();
  }

  get isEnabled(): boolean {
    return this.client !== null;
  }

  async applyIndexSettings(): Promise<void> {
    if (!this.client) {
      return;
    }

    const index = this.client.index(this.indexName);
    await index.updateSearchableAttributes([
      'name',
      'description',
      'categoryName',
      'brand',
      'supplierName',
    ]);
    await index.updateFilterableAttributes([
      'status',
      'categoryId',
      'categorySlug',
      'price',
      'isFeatured',
      'inStock',
      'brand',
      'attributeFacets',
      'averageRating',
      'reviewCount',
    ]);
    await index.updateSortableAttributes(['price', 'createdAt', 'name', 'averageRating']);
    await index.updateRankingRules([
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness',
    ]);
    await index.updateSynonyms(DEFAULT_SYNONYMS);
    this.settingsApplied = true;
  }

  async indexProduct(doc: MeiliProductDocument): Promise<void> {
    if (!this.client) {
      return;
    }

    if (doc.status !== 'ACTIVE') {
      await this.deleteProduct(doc.id);
      return;
    }

    if (!this.settingsApplied) {
      await this.applyIndexSettings();
    }

    await this.client.index(this.indexName).addDocuments([doc]);
  }

  async indexProducts(docs: MeiliProductDocument[]): Promise<void> {
    if (!this.client || docs.length === 0) {
      return;
    }

    if (!this.settingsApplied) {
      await this.applyIndexSettings();
    }

    const active = docs.filter((doc) => doc.status === 'ACTIVE');
    if (active.length > 0) {
      await this.client.index(this.indexName).addDocuments(active);
    }
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
      filter: 'status = "ACTIVE"',
      limit,
    });
    return result.hits;
  }

  async searchCatalog(params: CatalogSearchParams): Promise<CatalogSearchResult | null> {
    if (!this.client) {
      return null;
    }

    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 24));
    const filters: string[] = ['status = "ACTIVE"'];

    if (params.categorySlug) {
      filters.push(`categorySlug = "${params.categorySlug}"`);
    }
    if (params.brand) {
      filters.push(`brand = "${params.brand}"`);
    }
    if (params.minPrice !== undefined) {
      filters.push(`price >= ${params.minPrice}`);
    }
    if (params.maxPrice !== undefined) {
      filters.push(`price <= ${params.maxPrice}`);
    }
    if (params.minRating !== undefined) {
      filters.push(`averageRating >= ${params.minRating}`);
    }
    if (params.inStock === true) {
      filters.push('inStock = true');
    }
    if (params.attributes) {
      for (const [name, value] of Object.entries(params.attributes)) {
        const normalized = value.trim().toLowerCase().replace(/\s+/g, '-');
        filters.push(`attributeFacets = "${name.trim()}:${normalized}"`);
      }
    }

    const sort = this.resolveSort(params.sort);

    const result = await this.client.index(this.indexName).search<MeiliProductDocument>(
      params.query?.trim() ?? '',
      {
        filter: filters.join(' AND '),
        facets: ['categorySlug', 'brand', 'attributeFacets', 'inStock'],
        sort,
        limit,
        offset: (page - 1) * limit,
      },
    );

    return {
      hits: result.hits,
      total: result.estimatedTotalHits ?? result.hits.length,
      page,
      limit,
      facets: (result.facetDistribution ?? {}) as Record<string, Record<string, number>>,
    };
  }

  async replaceAllDocuments(docs: MeiliProductDocument[]): Promise<number> {
    if (!this.client) {
      return 0;
    }

    if (!this.settingsApplied) {
      await this.applyIndexSettings();
    }

    const task = await this.client.index(this.indexName).deleteAllDocuments();
    await this.client.waitForTask(task.taskUid);

    const active = docs.filter((doc) => doc.status === 'ACTIVE');
    if (active.length === 0) {
      return 0;
    }

    const addTask = await this.client.index(this.indexName).addDocuments(active);
    await this.client.waitForTask(addTask.taskUid);
    return active.length;
  }

  private resolveSort(sort?: CatalogSearchParams['sort']): string[] | undefined {
    switch (sort) {
      case 'price_asc':
        return ['price:asc'];
      case 'price_desc':
        return ['price:desc'];
      case 'name_asc':
        return ['name:asc'];
      case 'newest':
        return ['createdAt:desc'];
      default:
        return undefined;
    }
  }
}
