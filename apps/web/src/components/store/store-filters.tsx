'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FormSelect } from '@/components/ui/form-select';
import type { CatalogFacetValue, Category } from '@repo/shared-types';

export interface StoreFilterValues {
  search: string;
  categorySlug: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  inStock: boolean;
  sort: string;
}

interface StoreFiltersProps {
  values: StoreFilterValues;
  categories: Category[];
  brandFacets?: CatalogFacetValue[];
  onApply: (values: StoreFilterValues) => void;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'name_asc', label: 'Nombre A-Z' },
];

const EMPTY_BRAND_FACETS: CatalogFacetValue[] = [];

function InStockFilter({
  inStock,
  onChange,
}: {
  inStock: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id="inStock"
        checked={inStock}
        onCheckedChange={(value) => onChange(value === true)}
        aria-label="Solo con stock"
      />
      <Label htmlFor="inStock" className="cursor-pointer font-bold uppercase">
        Solo con stock
      </Label>
    </div>
  );
}

export function StoreFilters({
  values,
  categories,
  brandFacets = EMPTY_BRAND_FACETS,
  onApply,
}: StoreFiltersProps) {
  const [draft, setDraft] = React.useState(values);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply(draft);
  }

  return (
    <form
      className="flex flex-col gap-4 border-[3px] border-neo-onyx bg-white p-5 shadow-[6px_6px_0_0_#111111]"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="search">Buscar</Label>
        <Input
          id="search"
          name="search"
          value={draft.search}
          onChange={(event) => setDraft((current) => ({ ...current, search: event.target.value }))}
          placeholder="Buscar productos..."
          className="normal-case placeholder:font-medium placeholder:normal-case"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Categoría</Label>
        <FormSelect
          id="category"
          name="category"
          value={draft.categorySlug}
          onValueChange={(categorySlug) => setDraft((current) => ({ ...current, categorySlug }))}
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
            value={draft.minPrice}
            onChange={(event) => setDraft((current) => ({ ...current, minPrice: event.target.value }))}
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
            value={draft.maxPrice}
            onChange={(event) => setDraft((current) => ({ ...current, maxPrice: event.target.value }))}
          />
        </div>
      </div>

      {brandFacets.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="brand">Marca</Label>
          <FormSelect
            id="brand"
            name="brand"
            value={draft.brand}
            onValueChange={(brand) => setDraft((current) => ({ ...current, brand }))}
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
          value={draft.minRating}
          onValueChange={(minRating) => setDraft((current) => ({ ...current, minRating }))}
          placeholder="Cualquiera"
          options={[
            { value: '', label: 'Cualquiera' },
            { value: '4', label: '4+ estrellas' },
            { value: '3', label: '3+ estrellas' },
            { value: '2', label: '2+ estrellas' },
          ]}
        />
      </div>

      <InStockFilter
        inStock={draft.inStock}
        onChange={(inStock) => setDraft((current) => ({ ...current, inStock }))}
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="sort">Ordenar</Label>
        <FormSelect
          id="sort"
          name="sort"
          value={draft.sort}
          onValueChange={(sort) => setDraft((current) => ({ ...current, sort }))}
          options={SORT_OPTIONS}
        />
      </div>

      <Button type="submit" className="w-full">
        Aplicar filtros
      </Button>
    </form>
  );
}
