'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/client-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@repo/shared-utils';
import type { Income, IncomeSource } from '@repo/shared-types';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

const SOURCES: IncomeSource[] = ['ORDER', 'INVESTMENT', 'OTHER'];

export function IncomesView() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [source, setSource] = React.useState<IncomeSource>('OTHER');
  const [amount, setAmount] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const incomesQuery = useQuery({
    queryKey: ['finance', 'incomes'],
    queryFn: () => api.finance.incomes.findAll({ limit: 50 }),
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ingresos</h1>
          <p className="text-sm text-muted-foreground">
            <Link href="/admin/finance" className="underline">
              Finanzas
            </Link>
            {' / Ingresos'}
          </p>
        </div>
      </div>

      <form
        className="grid gap-4 rounded-lg border p-4 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!amount || Number(amount) <= 0) return;
          createMutation.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="source">Fuente</Label>
          <Select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value as IncomeSource)}
          >
            {SOURCES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
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

      {incomesQuery.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
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
      )}
    </div>
  );
}
