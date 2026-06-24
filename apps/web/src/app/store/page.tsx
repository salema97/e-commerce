import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getServerApiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StoreAnalyticsTracker } from '@/components/analytics/store-analytics-tracker';
import { formatPrice } from '@repo/shared-utils';
import type { CatalogProductSummary, CatalogQuery, Category } from '@repo/shared-types';

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

export default async function StorePage({ searchParams }: StorePageProps) {
  const params = await searchParams;
  const api = getServerApiClient();

  const page = Math.max(1, Number(params.page ?? '1'));
  const catalogQuery: CatalogQuery & { attr?: string | string[] } = {
    q: params.search,
    category: params.category,
    brand: params.brand,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    minRating: params.minRating ? Number(params.minRating) : undefined,
    inStock: params.inStock === 'true' ? true : undefined,
    sort: (params.sort as CatalogQuery['sort']) ?? 'newest',
    page,
    limit: 12,
    attr: params.attr,
  };

  const [catalogResult, categoriesResult] = await Promise.allSettled([
    api.catalog.browse(catalogQuery),
    api.categories.findAll(),
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

  return (
    <div className="container mx-auto px-4 py-8">
      <React.Suspense fallback={null}>
        <StoreAnalyticsTracker />
      </React.Suspense>
      <h1 className="text-3xl font-bold">Tienda</h1>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row">
        <aside className="w-full lg:w-72">
          <form className="flex flex-col gap-4" action="/store" method="GET">
            <div className="flex flex-col gap-2">
              <label htmlFor="search" className="text-sm font-medium">
                Buscar
              </label>
              <Input
                id="search"
                name="search"
                defaultValue={params.search}
                placeholder="Buscar productos..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="category" className="text-sm font-medium">
                Categoría
              </label>
              <Select id="category" name="category" defaultValue={params.category ?? ''}>
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="minPrice" className="text-sm font-medium">
                  Precio mín.
                </label>
                <Input
                  id="minPrice"
                  name="minPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={params.minPrice}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="maxPrice" className="text-sm font-medium">
                  Precio máx.
                </label>
                <Input
                  id="maxPrice"
                  name="maxPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={params.maxPrice}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="minRating" className="text-sm font-medium">
                Valoración mínima
              </label>
              <Select id="minRating" name="minRating" defaultValue={params.minRating ?? ''}>
                <option value="">Cualquiera</option>
                <option value="4">4+ estrellas</option>
                <option value="3">3+ estrellas</option>
                <option value="2">2+ estrellas</option>
              </Select>
            </div>

            {brandFacets.length > 0 ? (
              <div className="flex flex-col gap-2">
                <label htmlFor="brand" className="text-sm font-medium">
                  Marca
                </label>
                <Select id="brand" name="brand" defaultValue={params.brand ?? ''}>
                  <option value="">Todas</option>
                  {brandFacets.map((facet) => (
                    <option key={facet.value} value={facet.value}>
                      {facet.value} ({facet.count})
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="inStock"
                value="true"
                defaultChecked={params.inStock === 'true'}
              />
              Solo con stock
            </label>

            {attributeFacets.length > 0 ? (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Atributos</span>
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

            <div className="flex flex-col gap-2">
              <label htmlFor="sort" className="text-sm font-medium">
                Ordenar
              </label>
              <Select id="sort" name="sort" defaultValue={params.sort ?? 'newest'}>
                <option value="newest">Más recientes</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="name_asc">Nombre A-Z</option>
              </Select>
            </div>

            <Button type="submit" className="w-full">
              Aplicar filtros
            </Button>
          </form>
        </aside>

        <div className="flex-1">
          <div className="mb-4 text-sm text-muted-foreground">
            Mostrando {catalog.items.length} de {catalog.total} productos
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {catalog.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {catalog.items.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              No se encontraron productos.
            </div>
          ) : null}

          <Separator className="my-8" />

          <div className="flex items-center justify-between">
            <Link href={buildHref({ ...params, page: String(page - 1) })} aria-disabled={page <= 1}>
              <Button variant="outline" disabled={page <= 1}>
                Anterior
              </Button>
            </Link>
            <span className="text-sm">
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
    </div>
  );
}

function ProductCard({ product }: { product: CatalogProductSummary }) {
  return (
    <Link href={`/store/${product.slug}`}>
      <Card className="group overflow-hidden hover:border-primary/50 transition-colors">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Sin imagen
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{product.name}</CardTitle>
          {product.reviewCount && product.reviewCount > 0 ? (
            <p className="text-xs text-muted-foreground">
              {(product.averageRating ?? 0).toFixed(1)} ★ ({product.reviewCount})
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          <div className="flex gap-2">
            {!product.inStock ? <Badge variant="outline">Agotado</Badge> : null}
            {product.compareAtPrice ? <Badge variant="secondary">Oferta</Badge> : null}
          </div>
        </CardContent>
      </Card>
    </Link>
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
