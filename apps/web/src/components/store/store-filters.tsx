'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  return (
    <div className="flex items-center gap-2">
      <input
        id="inStock"
        type="checkbox"
        name="inStock"
        value="true"
        defaultChecked={inStock}
        aria-label="Solo con stock"
        className="size-5 shrink-0 appearance-none border-[3px] border-neo-onyx bg-white shadow-[2px_2px_0_0_#111111] checked:bg-neo-onyx checked:bg-[length:12px_12px] checked:bg-center checked:bg-no-repeat checked:bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%224%22%3E%3Cpath%20d%3D%22M5%2013l4%204L19%207%22/%3E%3C/svg%3E')]"
      />
      <Label htmlFor="inStock" className="cursor-pointer font-medium normal-case">
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
          className="normal-case"
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
