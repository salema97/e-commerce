'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FormSelect } from '@/components/ui/form-select';
import type { CatalogFacetValue, Category } from '@repo/shared-types';

interface StoreFiltersProps {
  search?: string;
  categorySlug?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  inStock?: boolean;
  sort: string;
  categories: Category[];
  brandFacets?: CatalogFacetValue[];
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'name_asc', label: 'Nombre A-Z' },
];

const EMPTY_BRAND_FACETS: CatalogFacetValue[] = [];

function InStockFilter({ inStock }: { inStock: boolean }) {
  const [checked, setChecked] = React.useState(inStock);

  return (
    <div className="flex items-center gap-2">
      {checked ? <input type="hidden" name="inStock" value="true" /> : null}
      <Checkbox
        id="inStock"
        checked={checked}
        onCheckedChange={(value) => setChecked(value === true)}
        aria-label="Solo con stock"
      />
      <Label htmlFor="inStock" className="cursor-pointer font-bold uppercase">
        Solo con stock
      </Label>
    </div>
  );
}

export function StoreFilters({
  search = '',
  categorySlug = '',
  brand = '',
  minPrice = '',
  maxPrice = '',
  minRating = '',
  inStock = false,
  sort,
  categories,
  brandFacets = EMPTY_BRAND_FACETS,
}: StoreFiltersProps) {
  return (
    <form
      className="flex flex-col gap-4 border-[3px] border-neo-onyx bg-white p-5 shadow-[6px_6px_0_0_#111111]"
      action="/store"
      method="GET"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="search">Buscar</Label>
        <Input
          id="search"
          name="search"
          defaultValue={search}
          placeholder="Buscar productos..."
          className="normal-case placeholder:font-medium placeholder:normal-case"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Categoría</Label>
        <FormSelect
          id="category"
          name="category"
          defaultValue={categorySlug}
          placeholder="Todas"
          options={[
            { value: '', label: 'Todas' },
            ...categories.map((category) => ({
              value: category.slug,
              label: category.name,
            })),
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="minPrice">Precio mín.</Label>
          <Input
            id="minPrice"
            name="minPrice"
            type="number"
            min={0}
            step="0.01"
            defaultValue={minPrice}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="maxPrice">Precio máx.</Label>
          <Input
            id="maxPrice"
            name="maxPrice"
            type="number"
            min={0}
            step="0.01"
            defaultValue={maxPrice}
          />
        </div>
      </div>

      {brandFacets.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="brand">Marca</Label>
          <FormSelect
            id="brand"
            name="brand"
            defaultValue={brand}
            placeholder="Todas"
            options={[
              { value: '', label: 'Todas' },
              ...brandFacets.map((facet) => ({
                value: facet.value,
                label: `${facet.value} (${facet.count})`,
              })),
            ]}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="minRating">Valoración mínima</Label>
        <FormSelect
          id="minRating"
          name="minRating"
          defaultValue={minRating}
          placeholder="Cualquiera"
          options={[
            { value: '', label: 'Cualquiera' },
            { value: '4', label: '4+ estrellas' },
            { value: '3', label: '3+ estrellas' },
            { value: '2', label: '2+ estrellas' },
          ]}
        />
      </div>

      <InStockFilter key={inStock ? 'in-stock' : 'all'} inStock={inStock} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="sort">Ordenar</Label>
        <FormSelect id="sort" name="sort" defaultValue={sort} options={SORT_OPTIONS} />
      </div>

      <Button type="submit" className="w-full">
        Aplicar filtros
      </Button>
    </form>
  );
}
