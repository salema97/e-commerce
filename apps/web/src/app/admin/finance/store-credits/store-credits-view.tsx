'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiClient, useAuthApiReady } from '@/lib/client-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime, formatPrice } from '@repo/shared-utils';
import type { AdminStoreCredit } from '@repo/shared-types';

export function StoreCreditsView({
  initialStoreCredits,
}: {
  initialStoreCredits: AdminStoreCredit[];
}) {
  const api = useApiClient();
  const authReady = useAuthApiReady();
  const queryClient = useQueryClient();
  const [userId, setUserId] = React.useState('');
  const [amount, setAmount] = React.useState('');

  const { data: storeCredits } = useQuery({
    queryKey: ['finance', 'store-credits'],
    queryFn: () => api.finance.storeCredits.findAll(),
    initialData: initialStoreCredits,
    enabled: authReady,
  });

  const issueMutation = useMutation({
    mutationFn: () =>
      api.finance.storeCredits.issue({
        userId: userId.trim(),
        amount: Number(amount),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['finance', 'store-credits'] });
      setAmount('');
    },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        title="Crédito en tienda"
        subtitle="Emitir y ajustar saldos de clientes"
        showNetworkStatus={false}
      />

      <div className="neo-panel grid gap-4 p-4 md:grid-cols-[1fr_160px_auto]">
        <div className="space-y-2">
          <Label htmlFor="userId">ID de usuario</Label>
          <Input
            id="userId"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="UUID del cliente"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Monto (USD)</Label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            disabled={issueMutation.isPending || !userId.trim() || !amount}
            onClick={() => void issueMutation.mutateAsync()}
          >
            {issueMutation.isPending ? 'Emitiendo...' : 'Emitir crédito'}
          </Button>
        </div>
      </div>

      <div className="neo-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead>Actualizado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(storeCredits ?? []).map((credit) => (
              <TableRow key={credit.id}>
                <TableCell>{credit.userEmail ?? credit.userId}</TableCell>
                <TableCell>{formatPrice(credit.balance, { currency: credit.currency })}</TableCell>
                <TableCell>
                  {credit.expiresAt ? formatDateTime(credit.expiresAt) : '—'}
                </TableCell>
                <TableCell>{formatDateTime(credit.updatedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
