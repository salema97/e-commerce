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
    <div className="space-y-6">
      <div className="rounded-md border p-4">
        <h2 className="mb-3 font-semibold">Proveedores</h2>
        <ul className="space-y-2 text-sm">
          {initialProviders.map((provider) => (
            <li key={provider.id} className="flex items-center justify-between">
              <span>{provider.name}</span>
              <span className="text-muted-foreground text-xs">{provider.regions.join(', ')}</span>
            </li>
          ))}
        </ul>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-3">
        <h2 className="font-semibold">Comisiones marketplace</h2>
        <div className="rounded-md border">
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
                      <Badge>{fee.syncStatus}</Badge>
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
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Facturas SRI</h2>
        <div className="rounded-md border">
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
              {records
                .filter((record) => record.resourceType === 'invoice')
                .map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-xs">{record.resourceId.slice(0, 8)}</TableCell>
                    <TableCell>{record.provider}</TableCell>
                    <TableCell>
                      <Badge>{record.status}</Badge>
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
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
