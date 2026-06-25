'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormSelect } from '@/components/ui/form-select';
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
        <Label htmlFor="invoice-search" className="mb-1 block">
          Buscar
        </Label>
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
        <Label htmlFor="invoice-status" className="mb-1 block">
          Estado
        </Label>
        <FormSelect
          id="invoice-status"
          ariaLabel="Filtrar por estado"
          value={filters.status}
          onValueChange={(value) =>
            onFilterChange({ status: value as InvoiceStatus | '' })
          }
          placeholder="Todos"
          triggerClassName="md:w-40"
          options={STATUS_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
      </div>
      <div>
        <Label htmlFor="invoice-from" className="mb-1 block">
          Desde
        </Label>
        <Input
          id="invoice-from"
          type="date"
          value={filters.from}
          onChange={(e) => onFilterChange({ from: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="invoice-to" className="mb-1 block">
          Hasta
        </Label>
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
