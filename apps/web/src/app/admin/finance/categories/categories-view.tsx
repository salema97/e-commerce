'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/client-api';
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
import { Skeleton } from '@/components/ui/skeleton';

import type { ExpenseCategory } from '@repo/shared-types';

export function CategoriesView() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  const categoriesQuery = useQuery({
    queryKey: ['finance', 'expense-categories'],
    queryFn: () => api.finance.expenseCategories.findAll(),
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Categorías de gasto</h1>
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/finance" className="underline">
            Finanzas
          </Link>
          {' / Categorías'}
        </p>
      </div>

      <form
        className="grid gap-4 rounded-lg border p-4 md:grid-cols-3"
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

      {categoriesQuery.isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
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
      )}
    </div>
  );
}
