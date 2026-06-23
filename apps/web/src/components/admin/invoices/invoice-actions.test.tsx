import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InvoiceActions } from './invoice-actions';
import type { InvoiceStatus } from '@repo/shared-types';

const mockRetryInvoice = vi.fn();
const mockGetInvoiceDownloadUrl = vi.fn();

vi.mock('@/app/admin/invoices/actions', () => ({
  retryInvoice: (...args: unknown[]) => mockRetryInvoice(...args),
  retryCreditNote: vi.fn(),
  getInvoiceDownloadUrl: (...args: unknown[]) => mockGetInvoiceDownloadUrl(...args),
  getCreditNoteDownloadUrl: vi.fn(),
}));

describe('InvoiceActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.open = vi.fn();
  });

  it('renders retry button for failed invoices', () => {
    render(<InvoiceActions id="inv_1" status="FAILED" />);
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
  });

  it('does not render retry button for authorized invoices', () => {
    render(<InvoiceActions id="inv_1" status="AUTHORIZED" />);
    expect(screen.queryByRole('button', { name: /Reintentar/i })).not.toBeInTheDocument();
  });

  it('renders XML and PDF download buttons', () => {
    render(<InvoiceActions id="inv_1" status="AUTHORIZED" />);
    expect(screen.getByRole('button', { name: /XML/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /PDF/i })).toBeInTheDocument();
  });

  it('calls retryInvoice when retry is clicked', async () => {
    mockRetryInvoice.mockResolvedValueOnce({ id: 'inv_1', status: 'DRAFT' });
    const onRetry = vi.fn();
    render(<InvoiceActions id="inv_1" status="FAILED" onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));

    await waitFor(() => {
      expect(mockRetryInvoice).toHaveBeenCalledWith('inv_1');
      expect(onRetry).toHaveBeenCalled();
    });
  });

  it('opens signed XML URL when XML download is clicked', async () => {
    mockGetInvoiceDownloadUrl.mockResolvedValueOnce('https://example.com/signed.xml');
    render(<InvoiceActions id="inv_1" status="AUTHORIZED" />);

    fireEvent.click(screen.getByRole('button', { name: /XML/i }));

    await waitFor(() => {
      expect(mockGetInvoiceDownloadUrl).toHaveBeenCalledWith('inv_1', 'xml');
      expect(window.open).toHaveBeenCalledWith('https://example.com/signed.xml', '_blank');
    });
  });

  it('opens signed PDF URL when PDF download is clicked', async () => {
    mockGetInvoiceDownloadUrl.mockResolvedValueOnce('https://example.com/signed.pdf');
    render(<InvoiceActions id="inv_1" status="AUTHORIZED" />);

    fireEvent.click(screen.getByRole('button', { name: /PDF/i }));

    await waitFor(() => {
      expect(mockGetInvoiceDownloadUrl).toHaveBeenCalledWith('inv_1', 'pdf');
      expect(window.open).toHaveBeenCalledWith('https://example.com/signed.pdf', '_blank');
    });
  });

  it.each(['FAILED', 'REJECTED', 'DRAFT'] as InvoiceStatus[])('shows retry for %s status', (status) => {
    render(<InvoiceActions id="inv_1" status={status} />);
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
  });
});
