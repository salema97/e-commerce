import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { CatalogFacets, CatalogProductSummary, CatalogResponse, DomainEvent } from '@repo/shared-types';
import { Prisma } from '@prisma/client';
import { EventBus } from '../event-bus/event-bus.interface.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  MeilisearchService,
  type CatalogSearchParams,
  type MeiliProductDocument,
} from '../ai/search/meilisearch.service.js';
import type { CatalogQueryDto } from './dto/catalog-query.dto.js';
import { CatalogCacheService } from './catalog-cache.service.js';
import { EventBusProviderWiring } from '../event-bus/event-bus-provider.wiring.js';

@Injectable()
export class CatalogService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meilisearch: MeilisearchService,
    private readonly cache: CatalogCacheService,
    @Inject(EventBus) private readonly eventBus: EventBus,
    private readonly eventBusWiring: EventBusProviderWiring,
  ) {}

  onModuleInit(): void {
    this.eventBus.registerHandler((event) => this.handleCatalogInvalidation(event));
  }

  private async handleCatalogInvalidation(event: DomainEvent): Promise<void> {
    if (
      event.name === 'product.updated' ||
      event.name === 'product.deleted' ||
      event.name === 'inventory.changed'
    ) {
      await this.cache.invalidateCatalogQueries();
    }
  }

  async browse(query: CatalogQueryDto): Promise<CatalogResponse> {
    const cacheKey = this.cache.buildKey(query);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.browseUncached(query);
    await this.cache.set(cacheKey, result);
    return result;
  }

  private async browseUncached(query: CatalogQueryDto): Promise<CatalogResponse> {
    const params = this.toSearchParams(query);

    try {
      const meiliResult = await this.meilisearch.searchCatalog(params);
      if (meiliResult) {
        return {
          items: meiliResult.hits.map((hit) => this.mapMeiliHit(hit)),
          total: meiliResult.total,
          page: meiliResult.page,
          limit: meiliResult.limit,
          facets: this.mapFacets(meiliResult.facets),
        };
      }
    } catch {
      // Meilisearch unavailable at runtime — fall back to Prisma.
    }

    return this.browseWithPrisma(query);
  }

  private toSearchParams(query: CatalogQueryDto): CatalogSearchParams {
    const attributes = this.parseAttributeFilters(query.attr);
    return {
      query: query.q,
      categorySlug: query.category,
      brand: query.brand,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      minRating: query.minRating,
      inStock: query.inStock,
      sort: query.sort,
      page: query.page,
      limit: query.limit,
      attributes,
    };
  }

  private parseAttributeFilters(raw?: string | string[]): Record<string, string> | undefined {
    const entries = Array.isArray(raw) ? raw : raw ? [raw] : [];
    if (entries.length === 0) {
      return undefined;
    }

    const attributes: Record<string, string> = {};
    for (const entry of entries) {
      const [name, ...rest] = entry.split('=');
      const value = rest.join('=');
      if (name && value) {
        attributes[name] = value;
      }
    }
    return Object.keys(attributes).length > 0 ? attributes : undefined;
  }

  private mapMeiliHit(hit: MeiliProductDocument): CatalogProductSummary {
    return {
      id: hit.id,
      name: hit.name,
      slug: hit.slug,
      description: hit.description,
      price: hit.price,
      compareAtPrice: hit.compareAtPrice,
      categoryId: hit.categoryId,
      categorySlug: hit.categorySlug,
      categoryName: hit.categoryName,
      isFeatured: hit.isFeatured,
      inStock: hit.inStock,
      brand: hit.brand,
      imageUrl: hit.imageUrl,
      averageRating: hit.averageRating,
      reviewCount: hit.reviewCount,
    };
  }

  private mapFacets(distribution: Record<string, Record<string, number>>): CatalogFacets {
    const toValues = (bucket?: Record<string, number>) =>
      Object.entries(bucket ?? {})
        .map(([value, count]) => ({ value, count }))
        .sort((left, right) => right.count - left.count);

    return {
      categorySlug: toValues(distribution.categorySlug),
      brand: toValues(distribution.brand),
      attributeFacets: toValues(distribution.attributeFacets),
      inStock: toValues(
        Object.fromEntries(
          Object.entries(distribution.inStock ?? {}).map(([key, count]) => [
            key === 'true' ? 'in_stock' : 'out_of_stock',
            count,
          ]),
        ),
      ),
    };
  }

  private async browseWithPrisma(query: CatalogQueryDto): Promise<CatalogResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 24));
    const where: Prisma.ProductWhereInput = { status: 'ACTIVE' };

    if (query.category) {
      where.category = { slug: query.category };
    }
    if (query.brand) {
      where.attributes = { some: { name: { in: ['Marca', 'Brand', 'marca', 'brand'] }, value: query.brand } };
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) {
        where.price.gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        where.price.lte = query.maxPrice;
      }
    }
    if (query.q?.trim()) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.minRating !== undefined) {
      where.averageRating = { gte: query.minRating };
    }

    const orderBy = this.prismaOrderBy(query.sort);

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          compareAtPrice: true,
          isFeatured: true,
          averageRating: true,
          reviewCount: true,
          category: { select: { id: true, slug: true, name: true } },
          attributes: { select: { name: true, value: true } },
          images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
          inventory: { select: { quantity: true, reservedQuantity: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const items = rows.map((row) => {
      const available = row.inventory.reduce(
        (sum, inv) => sum + Math.max(0, inv.quantity - inv.reservedQuantity),
        0,
      );
      const brandAttr = row.attributes.find((attr) => /^(marca|brand)$/i.test(attr.name));

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        price: Number(row.price),
        compareAtPrice: row.compareAtPrice ? Number(row.compareAtPrice) : null,
        categoryId: row.category?.id ?? null,
        categorySlug: row.category?.slug ?? null,
        categoryName: row.category?.name ?? null,
        isFeatured: row.isFeatured,
        inStock: available > 0,
        brand: brandAttr?.value ?? null,
        imageUrl: row.images[0]?.url ?? null,
        averageRating: row.averageRating ? Number(row.averageRating) : null,
        reviewCount: row.reviewCount,
      } satisfies CatalogProductSummary;
    });

    const filteredItems =
      query.inStock === true ? items.filter((item) => item.inStock) : items;

    return {
      items: filteredItems,
      total: query.inStock === true ? filteredItems.length : total,
      page,
      limit,
      facets: {},
    };
  }

  private prismaOrderBy(
    sort?: CatalogQueryDto['sort'],
  ): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'price_asc':
        return { price: 'asc' };
      case 'price_desc':
        return { price: 'desc' };
      case 'name_asc':
        return { name: 'asc' };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }
}
