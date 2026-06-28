import type { CatalogQuery } from '@repo/shared-types';

export interface StoreCatalogParams {
  category?: string;
  search?: string;
  sort: CatalogQuery['sort'];
  page: number;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  inStock: boolean;
  attr?: string | string[];
}

type SearchParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function readString(source: SearchParamSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) {
    const value = source.get(key);
    return value ?? undefined;
  }
  const value = source[key];
  if (Array.isArray(value)) {
    return value[0] ?? undefined;
  }
  return value;
}

function readAttr(source: SearchParamSource): string | string[] | undefined {
  if (source instanceof URLSearchParams) {
    const values = source.getAll('attr').filter(Boolean);
    if (values.length === 0) return undefined;
    if (values.length === 1) return values[0];
    return values;
  }
  return source.attr;
}

export function parseStoreCatalogParams(source: SearchParamSource): StoreCatalogParams {
  return {
    category: readString(source, 'category'),
    search: readString(source, 'search'),
    sort: (readString(source, 'sort') as CatalogQuery['sort']) ?? 'newest',
    page: Math.max(1, Number(readString(source, 'page') ?? '1')),
    brand: readString(source, 'brand'),
    minPrice: readString(source, 'minPrice'),
    maxPrice: readString(source, 'maxPrice'),
    minRating: readString(source, 'minRating'),
    inStock: readString(source, 'inStock') === 'true',
    attr: readAttr(source),
  };
}

export function toCatalogQuery(
  params: StoreCatalogParams,
): CatalogQuery & { attr?: string | string[] } {
  return {
    q: params.search,
    category: params.category,
    brand: params.brand,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    minRating: params.minRating ? Number(params.minRating) : undefined,
    inStock: params.inStock ? true : undefined,
    sort: params.sort,
    page: params.page,
    limit: 12,
    attr: params.attr,
  };
}

export function buildStoreCatalogSearchParams(params: StoreCatalogParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.category) searchParams.set('category', params.category);
  if (params.brand) searchParams.set('brand', params.brand);
  if (params.minPrice) searchParams.set('minPrice', params.minPrice);
  if (params.maxPrice) searchParams.set('maxPrice', params.maxPrice);
  if (params.minRating) searchParams.set('minRating', params.minRating);
  if (params.inStock) searchParams.set('inStock', 'true');
  if (params.sort && params.sort !== 'newest') searchParams.set('sort', params.sort);
  if (params.page > 1) searchParams.set('page', String(params.page));

  const attr = params.attr;
  if (attr) {
    if (Array.isArray(attr)) {
      for (const entry of attr) {
        if (entry) searchParams.append('attr', entry);
      }
    } else {
      searchParams.set('attr', attr);
    }
  }

  return searchParams;
}

export function storeCatalogPath(params: StoreCatalogParams): string {
  const query = buildStoreCatalogSearchParams(params).toString();
  return query ? `/store?${query}` : '/store';
}

export function storeCatalogParamsKey(params: StoreCatalogParams): string {
  return buildStoreCatalogSearchParams(params).toString();
}
