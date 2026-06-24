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
import type { Expense, ExpenseCategory, ExpenseStatus } from '@repo/shared-types';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function ExpensesView({
  initialExpenses,
  initialCategories,
}: {
  initialExpenses: Expense[];
  initialCategories: ExpenseCategory[];
}) {
  const api = useApiClient();
  const authReady = useAuthApiReady();
  const queryClient = useQueryClient();
  const [amount, setAmount] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [categoryId, setCategoryId] = React.useState<string>('');
  const [status, setStatus] = React.useState<ExpenseStatus>('PENDING');

  const categoriesQuery = useQuery({
    queryKey: ['finance', 'expense-categories'],
    queryFn: () => api.finance.expenseCategories.findAll(),
    initialData: initialCategories,
    enabled: authReady,
  });

  const expensesQuery = useQuery({
    queryKey: ['finance', 'expenses'],
    queryFn: () => api.finance.expenses.findAll({ limit: 50 }),
    initialData: initialExpenses,
    enabled: authReady,
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
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        title="Gastos"
        subtitle="Finanzas / Gastos"
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
          <FormSelect
            id="category"
            value={categoryId}
            onValueChange={setCategoryId}
            placeholder="Opcional"
            options={[
              { value: '', label: 'Opcional' },
              ...(categoriesQuery.data ?? []).map((category: ExpenseCategory) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <FormSelect
            id="status"
            value={status}
            onValueChange={(value) => setStatus(value as ExpenseStatus)}
            options={[
              { value: 'PENDING', label: 'PENDING' },
              { value: 'PAID', label: 'PAID' },
              { value: 'CANCELLED', label: 'CANCELLED' },
            ]}
          />
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
    </div>
  );
}
