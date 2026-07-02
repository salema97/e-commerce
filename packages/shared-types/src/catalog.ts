export type CatalogSort = 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

export interface CatalogQuery {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
  sort?: CatalogSort;
  page?: number;
  limit?: number;
  /** Flat attribute filters, e.g. { Color: 'rojo' } */
  attributes?: Record<string, string>;
}

export interface CatalogFacetValue {
  value: string;
  count: number;
}

export interface CatalogFacets {
  categorySlug?: CatalogFacetValue[];
  brand?: CatalogFacetValue[];
  attributeFacets?: CatalogFacetValue[];
  inStock?: CatalogFacetValue[];
}

export interface CatalogProductSummary {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  categoryId?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  isFeatured: boolean;
  inStock: boolean;
  brand?: string | null;
  imageUrl?: string | null;
  averageRating?: number | null;
  reviewCount?: number;
}

export interface CatalogResponse {
  items: CatalogProductSummary[];
  total: number;
  page: number;
  limit: number;
  facets: CatalogFacets;
}
