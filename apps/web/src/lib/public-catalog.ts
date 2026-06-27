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

export async function browseCatalog(
  query: CatalogQuery & { attr?: string | string[] },
): Promise<CatalogResponse> {
  return publicApi.catalog.browse(query);
}

export async function listCategories(): Promise<Category[]> {
  return publicApi.categories.findAll();
}

export async function findProductBySlug(slug: string): Promise<Product | null> {
  return publicApi.products.findBySlug(slug).catch(() => null);
}

export async function fetchProductReviews(productId: string): Promise<{
  reviews: ProductReview[];
  summary: ProductReviewSummary;
}> {
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

export async function listPublishedFaqs() {
  return publicApi.ai.faqs.findPublished().catch(() => []);
}

export async function findCmsPageBySlug(slug: string) {
  return publicApi.ai.cmsPages.findBySlug(slug).catch(() => null);
}
