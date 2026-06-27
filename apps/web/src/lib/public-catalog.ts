import { cacheLife, cacheTag } from 'next/cache';
import { createApiClient } from '@repo/api-client';
import type {
  CatalogQuery,
  CatalogResponse,
  Category,
  Product,
  ProductReview,
  ProductReviewSummary,
} from '@repo/shared-types';

const publicApi = createApiClient({
  baseURL: process.env.API_BASE_URL ?? 'http://localhost:3001/v1',
});

function catalogCacheStaleSeconds(): number {
  return Number(process.env.CATALOG_CACHE_TTL_SECONDS ?? '120');
}

export async function getCachedCatalog(
  query: CatalogQuery & { attr?: string | string[] },
): Promise<CatalogResponse> {
  'use cache';
  cacheTag('catalog');
  if (query.category) {
    cacheTag(`catalog-category-${query.category}`);
  }
  cacheLife({ stale: catalogCacheStaleSeconds() });

  return publicApi.catalog.browse(query);
}

export async function getCachedCategories(): Promise<Category[]> {
  'use cache';
  cacheTag('categories');
  cacheLife({ stale: catalogCacheStaleSeconds() });

  return publicApi.categories.findAll();
}

export async function getCachedProductBySlug(slug: string): Promise<Product | null> {
  'use cache';
  cacheTag('products', `product-slug-${slug}`);
  cacheLife({ stale: catalogCacheStaleSeconds() });

  return publicApi.products.findBySlug(slug).catch(() => null);
}

export async function getCachedProductReviews(productId: string): Promise<{
  reviews: ProductReview[];
  summary: ProductReviewSummary;
}> {
  'use cache';
  cacheTag('product-reviews', `product-reviews-${productId}`);
  cacheLife({ stale: catalogCacheStaleSeconds() });

  const emptySummary: ProductReviewSummary = {
    averageRating: 0,
    reviewCount: 0,
    distribution: {},
  };

  const [reviews, summary] = await Promise.all([
    publicApi.reviews.listByProduct(productId).catch(() => [] as ProductReview[]),
    publicApi.reviews.summary(productId).catch(() => emptySummary),
  ]);

  return { reviews, summary };
}
