'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import type { ExpenseCategory } from '@repo/shared-types';

export function CategoriesView({
  initialCategories,
}: {
  initialCategories: ExpenseCategory[];
}) {
  const api = useApiClient();
  const authReady = useAuthApiReady();
  const queryClient = useQueryClient();
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  const categoriesQuery = useQuery({
    queryKey: ['finance', 'expense-categories'],
    queryFn: () => api.finance.expenseCategories.findAll(),
    initialData: initialCategories,
    enabled: authReady,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.finance.expenseCategories.create({
        name,
        description: description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expense-categories'] });
      setName('');
      setDescription('');
    },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        title="Categorías"
        subtitle="Finanzas / Categorías de gasto"
        showNetworkStatus={false}
      />

      <form
        className="neo-panel grid gap-4 p-4 md:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          createMutation.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="md:col-span-3">
          <Button type="submit" disabled={createMutation.isPending}>
            Crear categoría
          </Button>
        </div>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(categoriesQuery.data ?? []).map((category: ExpenseCategory) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {category.description ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
