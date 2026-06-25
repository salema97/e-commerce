import type { MetadataRoute } from 'next';
import { getServerApiClient } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://example.com';
  const api = await getServerApiClient();

  const [products, categories] = await Promise.allSettled([
    api.products.findAll({ status: 'ACTIVE' }),
    api.categories.findAll(),
  ]);

  const productEntries =
    products.status === 'fulfilled'
      ? products.value.map((product) => ({
          url: `${baseUrl}/store/${product.slug}`,
          lastModified: new Date(product.updatedAt),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
      : [];

  const categoryEntries =
    categories.status === 'fulfilled'
      ? categories.value.map((category) => ({
          url: `${baseUrl}/store?category=${category.slug}`,
          lastModified: new Date(category.updatedAt),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }))
      : [];

  return [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/store`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    ...productEntries,
    ...categoryEntries,
  ];
}
