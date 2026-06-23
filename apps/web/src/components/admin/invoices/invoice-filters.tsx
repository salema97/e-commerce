'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { InvoiceStatus } from '@repo/shared-types';

const STATUS_OPTIONS: { value: InvoiceStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'SUBMITTED', label: 'Enviada' },
  { value: 'AUTHORIZED', label: 'Autorizada' },
  { value: 'REJECTED', label: 'Rechazada' },
  { value: 'FAILED', label: 'Fallida' },
];

export interface InvoiceFiltersState {
  search: string;
  status: InvoiceStatus | '';
  from: string;
  to: string;
}

interface InvoiceFiltersProps {
  filters: InvoiceFiltersState;
  onFilterChange: (filters: Partial<InvoiceFiltersState>) => void;
  onSearch: () => void;
}

export function InvoiceFilters({ filters, onFilterChange, onSearch }: InvoiceFiltersProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end">
      <div className="flex-1">
        <label htmlFor="invoice-search" className="mb-1 block text-sm font-medium">
          Buscar
        </label>
        <Input
          id="invoice-search"
          placeholder="Clave de acceso o ID de orden..."
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch();
          }}
        />
      </div>
      <div>
        <label htmlFor="invoice-status" className="mb-1 block text-sm font-medium">
          Estado
        </label>
        <select
          id="invoice-status"
          aria-label="Filtrar por estado"
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm md:w-40"
          value={filters.status}
          onChange={(e) => onFilterChange({ status: e.target.value as InvoiceStatus | '' })}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="invoice-from" className="mb-1 block text-sm font-medium">
          Desde
        </label>
        <Input
          id="invoice-from"
          type="date"
          value={filters.from}
          onChange={(e) => onFilterChange({ from: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="invoice-to" className="mb-1 block text-sm font-medium">
          Hasta
        </label>
        <Input
          id="invoice-to"
          type="date"
          value={filters.to}
          onChange={(e) => onFilterChange({ to: e.target.value })}
        />
      </div>
      <Button type="button" onClick={onSearch}>
        Filtrar
      </Button>
    </div>
  );
}
