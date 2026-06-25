import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvoiceFilters } from './invoice-filters';
import type { InvoiceFiltersState } from './invoice-filters';

function makeFilters(overrides?: Partial<InvoiceFiltersState>): InvoiceFiltersState {
  return {
    search: '',
    status: '',
    from: '',
    to: '',
    ...overrides,
  };
}

describe('InvoiceFilters', () => {
  it('renders search, status and date inputs', () => {
    render(
      <InvoiceFilters
        filters={makeFilters()}
        onFilterChange={vi.fn()}
        onSearch={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText(/Clave de acceso/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Filtrar por estado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Desde/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hasta/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Filtrar/i })).toBeInTheDocument();
  });

  it('calls onFilterChange when search changes', () => {
    const onFilterChange = vi.fn();
    render(
      <InvoiceFilters
        filters={makeFilters()}
        onFilterChange={onFilterChange}
        onSearch={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/Clave de acceso/i), {
      target: { value: '1234567890' },
    });
    expect(onFilterChange).toHaveBeenCalledWith({ search: '1234567890' });
  });

  it('calls onFilterChange when status changes', () => {
    const onFilterChange = vi.fn();
    render(
      <InvoiceFilters
        filters={makeFilters()}
        onFilterChange={onFilterChange}
        onSearch={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: /Filtrar por estado/i }));
    fireEvent.click(screen.getByRole('option', { name: /Fallida/i }));

    expect(onFilterChange).toHaveBeenCalledWith({ status: 'FAILED' });
  });

  it('calls onFilterChange when date range changes', () => {
    const onFilterChange = vi.fn();
    render(
      <InvoiceFilters
        filters={makeFilters()}
        onFilterChange={onFilterChange}
        onSearch={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Desde/i), {
      target: { value: '2024-01-01' },
    });
    expect(onFilterChange).toHaveBeenCalledWith({ from: '2024-01-01' });

    fireEvent.change(screen.getByLabelText(/Hasta/i), {
      target: { value: '2024-01-31' },
    });
    expect(onFilterChange).toHaveBeenCalledWith({ to: '2024-01-31' });
  });

  it('calls onSearch when filter button is clicked', () => {
    const onSearch = vi.fn();
    render(
      <InvoiceFilters
        filters={makeFilters()}
        onFilterChange={vi.fn()}
        onSearch={onSearch}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Filtrar/i }));
    expect(onSearch).toHaveBeenCalled();
  });

  it('calls onSearch when Enter is pressed in search input', () => {
    const onSearch = vi.fn();
    render(
      <InvoiceFilters
        filters={makeFilters()}
        onFilterChange={vi.fn()}
        onSearch={onSearch}
      />,
    );

    fireEvent.keyDown(screen.getByPlaceholderText(/Clave de acceso/i), {
      key: 'Enter',
      code: 'Enter',
    });
    expect(onSearch).toHaveBeenCalled();
  });
});
