'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormSelect } from '@/components/ui/form-select';
import type { Category } from '@repo/shared-types';

interface StoreFiltersProps {
  search?: string;
  categorySlug?: string;
  sort: string;
  categories: Category[];
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'name_asc', label: 'Nombre A-Z' },
];

export function StoreFilters({
  search = '',
  categorySlug = '',
  sort,
  categories,
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="sort">Ordenar</Label>
        <FormSelect
          id="sort"
          name="sort"
          defaultValue={sort}
          options={SORT_OPTIONS}
        />
      </div>

      <Button type="submit" className="w-full">
        Aplicar filtros
      </Button>
    </form>
  );
}
