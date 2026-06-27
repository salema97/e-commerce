'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { useApiClient } from '@/lib/client-api';
import { formatPrice } from '@repo/shared-utils';
import type { Quote } from '@repo/shared-types';

interface QuotesAdminPanelProps {
  initialQuotes: Quote[];
}

export function QuotesAdminPanel({ initialQuotes }: QuotesAdminPanelProps) {
  const api = useApiClient();
  const router = useRouter();
  const [quotes, setQuotes] = useState(initialQuotes);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const refreshed = await api.quotes.adminList();
    setQuotes(refreshed);
    router.refresh();
  }

  async function approve(id: string) {
    setPendingId(id);
    setError(null);
    try {
      await api.quotes.updateStatus(id, { status: 'APPROVED' });
      await refresh();
    } catch {
      setError('No se pudo aprobar la cotización.');
    } finally {
      setPendingId(null);
    }
  }

  async function convert(id: string) {
    setPendingId(id);
    setError(null);
    try {
      await api.quotes.convert(id);
      await refresh();
    } catch {
      setError('No se pudo convertir a orden.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8">
      <AdminPageHeader
        eyebrow="Ventas"
        title="Cotizaciones"
        subtitle="Aprueba cotizaciones B2B y conviértelas en pedidos."
        metrics={[{ label: 'Total', value: String(quotes.length) }]}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell className="font-mono text-xs">{quote.id.slice(0, 8)}</TableCell>
                <TableCell>{quote.company?.name ?? quote.companyId ?? '—'}</TableCell>
                <TableCell>{formatPrice(quote.total)}</TableCell>
                <TableCell>
                  <Badge>{quote.status}</Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {quote.status === 'PENDING_APPROVAL' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pendingId === quote.id}
                      onClick={() => void approve(quote.id)}
                    >
                      Aprobar
                    </Button>
                  ) : null}
                  {quote.status === 'APPROVED' ? (
                    <Button
                      size="sm"
                      disabled={pendingId === quote.id}
                      onClick={() => void convert(quote.id)}
                    >
                      Convertir
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
  );
}
