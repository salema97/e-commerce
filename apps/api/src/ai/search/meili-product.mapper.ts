import type { Prisma } from '@prisma/client';
import type { MeiliProductDocument } from './meilisearch.service.js';

export const productIndexSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  status: true,
  price: true,
  compareAtPrice: true,
  isFeatured: true,
  createdAt: true,
  category: { select: { id: true, slug: true, name: true } },
  supplier: { select: { name: true } },
  attributes: { select: { name: true, value: true } },
  images: { take: 1, orderBy: { sortOrder: 'asc' as const }, select: { url: true } },
  inventory: { select: { quantity: true, reservedQuantity: true } },
} satisfies Prisma.ProductSelect;

export type ProductForIndex = Prisma.ProductGetPayload<{ select: typeof productIndexSelect }>;

function normalizeFacetValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function extractBrand(attributes: Array<{ name: string; value: string }>): string | null {
  const brandAttr = attributes.find((attr) => /^(marca|brand)$/i.test(attr.name.trim()));
  return brandAttr?.value.trim() || null;
}

export function mapProductToMeiliDocument(product: ProductForIndex): MeiliProductDocument {
  const available = product.inventory.reduce(
    (sum, row) => sum + Math.max(0, row.quantity - row.reservedQuantity),
    0,
  );

  const attributeFacets = product.attributes
    .filter((attr) => !/^(marca|brand)$/i.test(attr.name.trim()))
    .map((attr) => `${attr.name.trim()}:${normalizeFacetValue(attr.value)}`);

  const brand = extractBrand(product.attributes);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    status: product.status,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    categoryId: product.category?.id ?? null,
    categorySlug: product.category?.slug ?? null,
    categoryName: product.category?.name ?? null,
    isFeatured: product.isFeatured,
    inStock: available > 0,
    supplierName: product.supplier?.name ?? null,
    brand,
    attributeFacets,
    imageUrl: product.images[0]?.url ?? null,
    createdAt: product.createdAt.getTime(),
  };
}
