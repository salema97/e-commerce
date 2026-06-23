import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InvoiceStatusBadge } from './invoice-status-badge';
import type { InvoiceStatus } from '@repo/shared-types';

const STATUS_CASES: { status: InvoiceStatus; label: string }[] = [
  { status: 'DRAFT', label: 'Borrador' },
  { status: 'SUBMITTED', label: 'Enviada' },
  { status: 'AUTHORIZED', label: 'Autorizada' },
  { status: 'REJECTED', label: 'Rechazada' },
  { status: 'FAILED', label: 'Fallida' },
];

describe('InvoiceStatusBadge', () => {
  it.each(STATUS_CASES)('renders $status as $label', ({ status, label }) => {
    render(<InvoiceStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('renders a badge element', () => {
    render(<InvoiceStatusBadge status="AUTHORIZED" />);
    expect(screen.getByText('Autorizada')).toHaveClass('inline-flex');
  });
});
