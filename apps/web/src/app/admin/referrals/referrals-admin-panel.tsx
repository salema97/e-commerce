'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
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
import { useApiClient } from '@/lib/client-api';
import { formatPrice } from '@repo/shared-utils';
import type { ReferralPerformanceReport } from '@repo/shared-types';

interface ReferralsAdminPanelProps {
  initialReport: ReferralPerformanceReport;
}

export function ReferralsAdminPanel({ initialReport }: ReferralsAdminPanelProps) {
  const api = useApiClient();
  const router = useRouter();
  const [report, setReport] = useState(initialReport);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function payout(conversionId: string) {
    setPendingId(conversionId);
    setError(null);
    try {
      await api.referrals.payout(conversionId, { payoutMethod: 'STORE_CREDIT' });
      const refreshed = await api.referrals.adminPerformance();
      setReport(refreshed);
      router.refresh();
    } catch {
      setError('No se pudo procesar el pago.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8">
      <AdminPageHeader
        eyebrow="Marketing"
        title="Programa de referidos"
        subtitle="Conversiones y comisiones de afiliados."
        metrics={[
          { label: 'Conversiones', value: String(report.totalConversions) },
          { label: 'Pendiente', value: formatPrice(report.pendingCommission) },
          { label: 'Pagado', value: formatPrice(report.paidCommission) },
        ]}
      />
      <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead>Comisión</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.conversions.map((conversion) => (
              <TableRow key={conversion.id}>
                <TableCell>{conversion.id.slice(0, 8)}</TableCell>
                <TableCell>{conversion.orderId?.slice(0, 8) ?? '-'}</TableCell>
                <TableCell>{formatPrice(conversion.commissionAmount)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{conversion.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {conversion.status === 'PENDING' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pendingId === conversion.id}
                      onClick={() => void payout(conversion.id)}
                    >
                      {pendingId === conversion.id ? 'Procesando...' : 'Pagar crédito'}
                    </Button>
                  ) : (
                    '-'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </div>
    </div>
  );
}
