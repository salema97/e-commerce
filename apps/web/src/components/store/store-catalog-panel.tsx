'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { StoreFilters, type StoreFilterValues } from '@/components/store/store-filters';
import { StoreProductGrid } from '@/components/store/store-product-grid';
import { useApiQueryHooks } from '@/lib/client-api';
import {
  parseStoreCatalogParams,
  storeCatalogParamsKey,
  storeCatalogPath,
  toCatalogQuery,
  type StoreCatalogParams,
} from '@/lib/store-catalog-params';
import type { CatalogResponse, Category } from '@repo/shared-types';
import { shouldShowPagination } from '@/lib/pagination';

interface StoreCatalogPanelProps {
  categories: Category[];
  initialParams: StoreCatalogParams;
  initialCatalog: CatalogResponse;
}

function pushStoreCatalogUrl(params: StoreCatalogParams): void {
  window.history.pushState(window.history.state, '', storeCatalogPath(params));
}

export function StoreCatalogPanel({
  categories,
  initialParams,
  initialCatalog,
}: StoreCatalogPanelProps) {
  const hooks = useApiQueryHooks();
  const [params, setParams] = React.useState(initialParams);
  const catalogQuery = React.useMemo(() => toCatalogQuery(params), [params]);

  const { data: catalog = initialCatalog } = hooks.useCatalog(catalogQuery, {
    placeholderData: (previous) => previous ?? initialCatalog,
  });

  React.useEffect(() => {
    const onPopState = () => {
      setParams(parseStoreCatalogParams(new URLSearchParams(window.location.search)));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const applyParams = React.useCallback((next: StoreCatalogParams) => {
    setParams(next);
    pushStoreCatalogUrl(next);
  }, []);

  const handleFilterApply = React.useCallback(
    (values: StoreFilterValues) => {
      applyParams({
        ...params,
        search: values.search.trim() || undefined,
        category: values.categorySlug || undefined,
        brand: values.brand || undefined,
        minPrice: values.minPrice || undefined,
        maxPrice: values.maxPrice || undefined,
        minRating: values.minRating || undefined,
        inStock: values.inStock,
        sort: (values.sort as StoreCatalogParams['sort']) || 'newest',
        page: 1,
      });
    },
    [applyParams, params],
  );

  const toggleAttribute = React.useCallback(
    (attrValue: string) => {
      const current = params.attr;
      const active = Array.isArray(current)
        ? current.includes(attrValue)
        : current === attrValue;

      let nextAttr: string | string[] | undefined;
      if (active) {
        if (Array.isArray(current)) {
          const filtered = current.filter((entry) => entry !== attrValue);
          nextAttr = filtered.length === 0 ? undefined : filtered.length === 1 ? filtered[0] : filtered;
        } else {
          nextAttr = undefined;
        }
      } else if (Array.isArray(current)) {
        nextAttr = [...current, attrValue];
      } else if (current) {
        nextAttr = [current, attrValue];
      } else {
        nextAttr = attrValue;
      }

      applyParams({
        ...params,
        attr: nextAttr,
        page: 1,
      });
    },
    [applyParams, params],
  );

  const attributeFacets = catalog.facets.attributeFacets ?? [];
  const brandFacets = catalog.facets.brand ?? [];
  const activeCategory = categories.find((category) => category.slug === params.category);
  const gridKey = storeCatalogParamsKey(params);
  const showPagination = shouldShowPagination(catalog.total, catalog.limit);

  return (
    <>
      {activeCategory ? (
        <p className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Categoría: {activeCategory.name}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <aside className="w-full lg:w-72">
          <StoreFilters
            key={gridKey}
            values={{
              search: params.search ?? '',
              categorySlug: params.category ?? '',
              brand: params.brand ?? '',
              minPrice: params.minPrice ?? '',
              maxPrice: params.maxPrice ?? '',
              minRating: params.minRating ?? '',
              inStock: params.inStock,
              sort: params.sort ?? 'newest',
            }}
            categories={categories}
            brandFacets={brandFacets}
            onApply={handleFilterApply}
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
                    <button
                      key={facet.value}
                      type="button"
                      onClick={() => toggleAttribute(attrValue)}
                      className="cursor-pointer"
                    >
                      <Badge variant={active ? 'default' : 'secondary'}>
                        {name}: {value} ({facet.count})
                      </Badge>
                    </button>
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

          <StoreProductGrid products={catalog.items} animationKey={gridKey} />

          {catalog.items.length === 0 ? (
            <div className="border-[3px] border-dashed border-neo-onyx py-20 text-center font-bold uppercase text-muted-foreground">
              No se encontraron productos.
            </div>
          ) : null}

          {showPagination ? <Separator className="my-8 border-neo-onyx" /> : null}

          <PaginationBar
            page={params.page}
            pageSize={catalog.limit}
            total={catalog.total}
            onPageChange={(page) => applyParams({ ...params, page })}
          />
        </div>
      </div>
    </>
  );
}
