import { Suspense } from 'react';
import type { Metadata } from 'next';
import { browseCatalog, listCategories } from '@/lib/public-catalog';
import { getSiteUrl } from '@/lib/site-url';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { StoreCatalogPanel } from '@/components/store/store-catalog-panel';
import { StoreAnalyticsTracker } from '@/components/analytics/store-analytics-tracker';
import {
  buildStoreCatalogSearchParams,
  parseStoreCatalogParams,
  toCatalogQuery,
} from '@/lib/store-catalog-params';

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
  const initialParams = parseStoreCatalogParams(params);
  const query = buildStoreCatalogSearchParams(initialParams).toString();
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
  const initialParams = parseStoreCatalogParams(params);

  const [catalogResult, categoriesResult] = await Promise.allSettled([
    browseCatalog(toCatalogQuery(initialParams)),
    listCategories(),
  ]);

  const initialCatalog =
    catalogResult.status === 'fulfilled'
      ? catalogResult.value
      : { items: [], total: 0, page: initialParams.page, limit: 12, facets: {} };
  const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];

  return (
    <AnimatedPageShell
      className="container mx-auto px-4 py-8"
      header={
        <header className="mb-10 border-b-[6px] border-neo-onyx pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Catálogo</p>
          <h1 className="font-anton text-5xl uppercase md:text-7xl">Tienda</h1>
        </header>
      }
    >
      <Suspense fallback={null}>
        <StoreAnalyticsTracker />
      </Suspense>
      <StoreCatalogPanel
        categories={categories}
        initialParams={initialParams}
        initialCatalog={initialCatalog}
      />
    </AnimatedPageShell>
  );
}
