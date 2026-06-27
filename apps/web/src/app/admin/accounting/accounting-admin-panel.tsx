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
import { AdminSectionTitle } from '@/components/admin/admin-section-title';
import { useApiClient } from '@/lib/client-api';
import { formatPrice } from '@repo/shared-utils';
import type {
  AccountingProviderProfile,
  AccountingSyncRecord,
  MarketplaceFeeReconciliation,
} from '@repo/shared-types';

interface AccountingAdminPanelProps {
  initialProviders: AccountingProviderProfile[];
  initialRecords: AccountingSyncRecord[];
  initialMarketplaceFees: MarketplaceFeeReconciliation[];
}

export function AccountingAdminPanel({
  initialProviders,
  initialRecords,
  initialMarketplaceFees,
}: AccountingAdminPanelProps) {
  const api = useApiClient();
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const [fees, setFees] = useState(initialMarketplaceFees);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function retrySync(invoiceId: string) {
    setPendingId(invoiceId);
    setError(null);
    try {
      await api.accounting.syncInvoice(invoiceId);
      const refreshed = await api.accounting.syncRecords();
      setRecords(refreshed);
      router.refresh();
    } catch {
      setError('No se pudo sincronizar la factura.');
    } finally {
      setPendingId(null);
    }
  }

  async function syncFee(orderId: string) {
    setPendingId(orderId);
    setError(null);
    try {
      await api.accounting.syncMarketplaceFee(orderId);
      const [refreshedRecords, refreshedFees] = await Promise.all([
        api.accounting.syncRecords(),
        api.accounting.marketplaceFees(),
      ]);
      setRecords(refreshedRecords);
      setFees(refreshedFees);
      router.refresh();
    } catch {
      setError('No se pudo reconciliar la comisión.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8">
      <AdminPageHeader
        eyebrow="Finanzas"
        title="Contabilidad"
        subtitle="Sincroniza facturas SRI y reconcilia comisiones de marketplace."
        metrics={[
          { label: 'Proveedores', value: String(initialProviders.length) },
          { label: 'Registros', value: String(records.length) },
        ]}
      />

      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-4">
          <AdminSectionTitle>Proveedores contables</AdminSectionTitle>
          {initialProviders.length === 0 ? (
            <p className="text-sm font-bold uppercase text-muted-foreground">
              Sin proveedores configurados.
            </p>
          ) : (
            <ul className="neo-panel divide-y divide-neo-onyx/15">
              {initialProviders.map((provider) => (
                <li
                  key={provider.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm font-bold uppercase"
                >
                  <span>{provider.name}</span>
                  <span className="text-xs font-medium normal-case text-muted-foreground">
                    {provider.regions.join(', ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {error ? <p className="text-sm font-bold text-destructive">{error}</p> : null}

        <section className="flex flex-col gap-4">
          <AdminSectionTitle>Comisiones marketplace</AdminSectionTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Comisión</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Sin órdenes marketplace con comisiones pendientes.
                  </TableCell>
                </TableRow>
              ) : (
                fees.map((fee) => (
                  <TableRow key={fee.orderId}>
                    <TableCell>{fee.orderNumber}</TableCell>
                    <TableCell>{fee.channel}</TableCell>
                    <TableCell>{formatPrice(fee.fees)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{fee.syncStatus}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {fee.syncStatus !== 'SYNCED' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pendingId === fee.orderId}
                          onClick={() => void syncFee(fee.orderId)}
                        >
                          Sincronizar
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>

        <section className="flex flex-col gap-4">
          <AdminSectionTitle>Facturas SRI</AdminSectionTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factura</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.flatMap((record) =>
                record.resourceType === 'invoice' ? (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-xs">{record.resourceId.slice(0, 8)}</TableCell>
                    <TableCell>{record.provider}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {record.status === 'FAILED' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pendingId === record.resourceId}
                          onClick={() => void retrySync(record.resourceId)}
                        >
                          Reintentar
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ) : (
                  []
                ),
              )}
            </TableBody>
          </Table>
        </section>
      </div>
    </div>
  );
}
