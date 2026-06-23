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
import type { Expense, ExpenseCategory, ExpenseStatus } from '@repo/shared-types';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function ExpensesView() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [amount, setAmount] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [categoryId, setCategoryId] = React.useState<string>('');
  const [status, setStatus] = React.useState<ExpenseStatus>('PENDING');

  const categoriesQuery = useQuery({
    queryKey: ['finance', 'expense-categories'],
    queryFn: () => api.finance.expenseCategories.findAll(),
  });

  const expensesQuery = useQuery({
    queryKey: ['finance', 'expenses'],
    queryFn: () => api.finance.expenses.findAll({ limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.finance.expenses.create({
        amount: Number(amount),
        description: description || undefined,
        categoryId: categoryId || undefined,
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] });
      setAmount('');
      setDescription('');
    },
  });

  const categoryMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categoriesQuery.data ?? []) {
      map.set(category.id, category.name);
    }
    return map;
  }, [categoriesQuery.data]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Gastos</h1>
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/finance" className="underline">
            Finanzas
          </Link>
          {' / Gastos'}
        </p>
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
        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Opcional</option>
            {(categoriesQuery.data ?? []).map((category: ExpenseCategory) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
          >
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="CANCELLED">CANCELLED</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="md:col-span-4">
          <Button type="submit" disabled={createMutation.isPending}>
            Registrar gasto
          </Button>
        </div>
      </form>

      {expensesQuery.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Adjuntos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(expensesQuery.data ?? []).map((expense: Expense) => (
              <TableRow key={expense.id}>
                <TableCell>{formatDateTime(expense.date)}</TableCell>
                <TableCell>
                  {expense.categoryId
                    ? (categoryMap.get(expense.categoryId) ?? expense.categoryId)
                    : '—'}
                </TableCell>
                <TableCell>{expense.status}</TableCell>
                <TableCell>{formatMoney(expense.amount)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {expense.description ?? '—'}
                </TableCell>
                <TableCell>{expense.attachmentKeys?.length ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
