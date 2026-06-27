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
import type { GiftCard } from '@repo/shared-types';

export function GiftCardsView({ initialGiftCards }: { initialGiftCards: GiftCard[] }) {
  const api = useApiClient();
  const authReady = useAuthApiReady();
  const queryClient = useQueryClient();
  const [initialBalance, setInitialBalance] = React.useState('50');

  const { data: giftCards } = useQuery({
    queryKey: ['finance', 'gift-cards'],
    queryFn: () => api.finance.giftCards.findAll(),
    initialData: initialGiftCards,
    enabled: authReady,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.finance.giftCards.create({
        initialBalance: Number(initialBalance),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['finance', 'gift-cards'] });
    },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        title="Gift cards"
        subtitle="Crear y administrar tarjetas regalo"
        showNetworkStatus={false}
      />

      <div className="neo-panel flex flex-wrap items-end gap-4 p-4">
        <div className="space-y-2">
          <Label htmlFor="initialBalance">Monto inicial (USD)</Label>
          <Input
            id="initialBalance"
            type="number"
            min="1"
            step="0.01"
            value={initialBalance}
            onChange={(event) => setInitialBalance(event.target.value)}
            required
          />
        </div>
        <Button
          type="button"
          disabled={createMutation.isPending}
          onClick={() => void createMutation.mutateAsync()}
        >
          {createMutation.isPending ? 'Creando...' : 'Crear gift card'}
        </Button>
      </div>

      <div className="neo-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Asignado a</TableHead>
              <TableHead>Creado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(giftCards ?? []).map((card) => (
              <TableRow key={card.id}>
                <TableCell className="font-mono">{card.code}</TableCell>
                <TableCell>{formatPrice(card.balance, { currency: card.currency })}</TableCell>
                <TableCell>{card.isActive ? 'Activa' : 'Inactiva'}</TableCell>
                <TableCell>{card.issuedToUserEmail ?? '—'}</TableCell>
                <TableCell>{formatDateTime(card.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
