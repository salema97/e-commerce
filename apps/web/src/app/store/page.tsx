import Link from 'next/link';
import { getServerApiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { StoreFilters } from '@/components/store/store-filters';
import { StoreProductGrid } from '@/components/store/store-product-grid';
import type { Product, Category } from '@repo/shared-types';

interface StorePageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function StorePage({ searchParams }: StorePageProps) {
  const params = await searchParams;
  const api = await getServerApiClient();

  const categorySlug = params.category;
  const search = params.search;
  const sort = params.sort ?? 'newest';
  const page = Math.max(1, Number(params.page ?? '1'));
  const limit = 12;

  const [productsResult, categoriesResult] = await Promise.allSettled([
    api.products.findAll({ status: 'ACTIVE' }),
    api.categories.findAll(),
  ]);

  let products: Product[] = productsResult.status === 'fulfilled' ? productsResult.value : [];
  const categories: Category[] = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];

  if (categorySlug) {
    const category = categories.find((c) => c.slug === categorySlug);
    if (category) {
      products = products.filter((p) => p.categoryId === category.id);
    }
  }

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q),
    );
  }

  products = sortProducts(products, sort);

  const total = products.length;
  const start = (page - 1) * limit;
  const paginatedProducts = products.slice(start, start + limit);
  const totalPages = Math.ceil(total / limit);
  const activeCategory = categories.find((c) => c.slug === categorySlug);

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
      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <aside className="w-full lg:w-72">
          <StoreFilters
            search={search}
            categorySlug={categorySlug}
            sort={sort}
            categories={categories}
          />
        </aside>

        <div className="flex-1">
          <div className="mb-6 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Mostrando {paginatedProducts.length} de {total} productos
          </div>

          <StoreProductGrid products={paginatedProducts} />

          {paginatedProducts.length === 0 ? (
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
              Página {page} de {totalPages || 1}
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

function sortProducts(products: Product[], sort: string): Product[] {
  const copy = [...products];
  switch (sort) {
    case 'price_asc':
      return copy.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return copy.sort((a, b) => b.price - a.price);
    case 'name_asc':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'newest':
    default:
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

function buildHref(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }
  const query = searchParams.toString();
  return query ? `/store?${query}` : '/store';
}
