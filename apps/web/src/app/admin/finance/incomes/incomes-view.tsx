'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient, useAuthApiReady } from '@/lib/client-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormSelect } from '@/components/ui/form-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@repo/shared-utils';
import type { Income, IncomeSource } from '@repo/shared-types';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

const SOURCES: IncomeSource[] = ['ORDER', 'INVESTMENT', 'OTHER'];

export function IncomesView({ initialIncomes }: { initialIncomes: Income[] }) {
  const api = useApiClient();
  const authReady = useAuthApiReady();
  const queryClient = useQueryClient();
  const [source, setSource] = React.useState<IncomeSource>('OTHER');
  const [amount, setAmount] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const incomesQuery = useQuery({
    queryKey: ['finance', 'incomes'],
    queryFn: () => api.finance.incomes.findAll({ limit: 50 }),
    initialData: initialIncomes,
    enabled: authReady,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.finance.incomes.create({
        source,
        amount: Number(amount),
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'incomes'] });
      setAmount('');
      setNotes('');
    },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        title="Ingresos"
        subtitle="Finanzas / Ingresos"
        showNetworkStatus={false}
      />

      <form
        className="neo-panel grid gap-4 p-4 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!amount || Number(amount) <= 0) return;
          createMutation.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="source">Fuente</Label>
          <FormSelect
            id="source"
            value={source}
            onValueChange={(value) => setSource(value as IncomeSource)}
            options={SOURCES.map((item) => ({ value: item, label: item }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opcional"
          />
        </div>
        <div className="md:col-span-4">
          <Button type="submit" disabled={createMutation.isPending}>
            Registrar ingreso
          </Button>
        </div>
      </form>

      <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Fuente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(incomesQuery.data ?? []).map((income: Income) => (
              <TableRow key={income.id}>
                <TableCell>{formatDateTime(income.date)}</TableCell>
                <TableCell>{income.source}</TableCell>
                <TableCell>{formatMoney(income.amount)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {income.notes ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
  );
}
