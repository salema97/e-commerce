'use client';

import * as React from 'react';
import { useApiQueryHooks, useAuthApiReady } from '@/lib/client-api';
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
  const hooks = useApiQueryHooks();
  const authReady = useAuthApiReady();
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  const { data: categories = initialCategories } = hooks.useFinanceExpenseCategories({
    initialData: initialCategories,
    enabled: authReady,
  });

  const createMutation = hooks.useCreateFinanceExpenseCategory({
    onSuccess: () => {
      setName('');
      setDescription('');
    },
  });

  function handleCreateCategory(): void {
    if (!name.trim()) return;
    createMutation.mutate({
      name,
      description: description || undefined,
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        title="Categorías"
        subtitle="Finanzas / Categorías de gasto"
        showNetworkStatus={false}
      />

      <div className="neo-panel grid gap-4 p-4 md:grid-cols-3">
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
          <Button type="button" disabled={createMutation.isPending} onClick={handleCreateCategory}>
            Crear categoría
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category: ExpenseCategory) => (
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
