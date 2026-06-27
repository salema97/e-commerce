import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { browseCatalog, listCategories } from '@/lib/public-catalog';
import { getSiteUrl } from '@/lib/site-url';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { StoreFilters } from '@/components/store/store-filters';
import { StoreProductGrid } from '@/components/store/store-product-grid';
import { StoreAnalyticsTracker } from '@/components/analytics/store-analytics-tracker';
import type { CatalogQuery, Category } from '@repo/shared-types';

interface StorePageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    inStock?: string;
    attr?: string | string[];
  }>;
}

function buildStoreCanonical(
  params: Record<string, string | string[] | undefined>,
): string {
  const searchParams = new URLSearchParams();
  for (const key of ['category', 'search', 'sort', 'page', 'brand', 'minPrice', 'maxPrice', 'minRating', 'inStock'] as const) {
    const value = params[key];
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry) searchParams.append(key, entry);
      }
    } else {
      searchParams.set(key, value);
    }
  }
  const query = searchParams.toString();
  return query ? `${getSiteUrl()}/store?${query}` : `${getSiteUrl()}/store`;
}

export async function generateMetadata({ searchParams }: StorePageProps): Promise<Metadata> {
  const params = await searchParams;
  return {
    title: 'Tienda',
    description: 'Explora nuestro catálogo de productos.',
    alternates: {
      canonical: buildStoreCanonical(params),
    },
  };
}

export default async function StorePage({ searchParams }: StorePageProps) {
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? '1'));
  const sort = (params.sort as CatalogQuery['sort']) ?? 'newest';
  const catalogQuery: CatalogQuery & { attr?: string | string[] } = {
    q: params.search,
    category: params.category,
    brand: params.brand,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    inStock: params.inStock === 'true' ? true : undefined,
    sort,
    page,
    limit: 12,
    attr: params.attr,
  };

  const [catalogResult, categoriesResult] = await Promise.allSettled([
    browseCatalog(catalogQuery),
    listCategories(),
  ]);

  const catalog =
    catalogResult.status === 'fulfilled'
      ? catalogResult.value
      : { items: [], total: 0, page, limit: 12, facets: {} };
  const categories: Category[] =
    categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];

  const totalPages = Math.max(1, Math.ceil(catalog.total / catalog.limit));
  const attributeFacets = catalog.facets.attributeFacets ?? [];
  const brandFacets = catalog.facets.brand ?? [];
  const activeCategory = categories.find((c) => c.slug === params.category);

  return (
    <AnimatedPageShell
      className="container mx-auto px-4 py-8"
      header={
        <header className="mb-10 border-b-[6px] border-neo-onyx pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Catálogo</p>
          <h1 className="font-anton text-5xl uppercase md:text-7xl">
            {activeCategory?.name ?? 'Tienda'}
          </h1>
        </header>
      }
    >
      <Suspense fallback={null}>
        <StoreAnalyticsTracker />
      </Suspense>
      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <aside className="w-full lg:w-72">
          <StoreFilters
            search={params.search}
            categorySlug={params.category}
            brand={params.brand}
            minPrice={params.minPrice}
            maxPrice={params.maxPrice}
            minRating={params.minRating}
            inStock={params.inStock === 'true'}
            sort={sort}
            categories={categories}
            brandFacets={brandFacets}
          />

          {attributeFacets.length > 0 ? (
            <div className="mt-4 flex flex-col gap-2 border-[3px] border-neo-onyx bg-white p-5 shadow-[6px_6px_0_0_#111111]">
              <span className="text-sm font-bold uppercase tracking-wide">Atributos</span>
              <div className="flex flex-wrap gap-2">
                {attributeFacets.slice(0, 8).map((facet) => {
                  const [name, value] = facet.value.split(':');
                  const attrValue = `${name}=${value}`;
                  const active = Array.isArray(params.attr)
                    ? params.attr.includes(attrValue)
                    : params.attr === attrValue;
                  return (
                    <Link
                      key={facet.value}
                      href={buildHref({
                        ...params,
                        attr: active ? undefined : attrValue,
                        page: '1',
                      })}
                    >
                      <Badge variant={active ? 'default' : 'secondary'}>
                        {name}: {value} ({facet.count})
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </aside>

        <div className="flex-1">
          <div className="mb-6 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Mostrando {catalog.items.length} de {catalog.total} productos
          </div>

          <StoreProductGrid products={catalog.items} />

          {catalog.items.length === 0 ? (
            <div className="border-[3px] border-dashed border-neo-onyx py-20 text-center font-bold uppercase text-muted-foreground">
              No se encontraron productos.
            </div>
          ) : null}

          <Separator className="my-8 border-neo-onyx" />

          <div className="flex items-center justify-between">
            <Link href={buildHref({ ...params, page: String(page - 1) })} aria-disabled={page <= 1}>
              <Button variant="outline" disabled={page <= 1}>
                Anterior
              </Button>
            </Link>
            <span className="text-sm font-bold uppercase">
              Página {page} de {totalPages}
            </span>
            <Link
              href={buildHref({ ...params, page: String(page + 1) })}
              aria-disabled={page >= totalPages}
            >
              <Button variant="outline" disabled={page >= totalPages}>
                Siguiente
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AnimatedPageShell>
  );
}

function buildHref(params: Record<string, string | string[] | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry) searchParams.append(key, entry);
      }
    } else {
      searchParams.set(key, value);
    }
  }
  const query = searchParams.toString();
  return query ? `/store?${query}` : '/store';
}
