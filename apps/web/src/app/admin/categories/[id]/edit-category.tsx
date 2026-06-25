'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { useApiClient } from '@/lib/client-api';
import type { Category } from '@repo/shared-types';

export default function EditCategoryPage({ category }: { category: Category }) {
  const router = useRouter();
  const api = useApiClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      await api.categories.update(category.id, {
        name: String(formData.get('name')),
        slug: String(formData.get('slug')),
        description: String(formData.get('description')),
        isActive: formData.get('isActive') === 'on',
      });
      router.push('/admin/categories');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatedPageShell
      className="flex flex-col gap-6"
      header={<h1 className="text-2xl font-bold">Editar categoría</h1>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{category.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" defaultValue={category.name} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">URL amigable</Label>
              <Input id="slug" name="slug" defaultValue={category.slug} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={category.description ?? ''}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                name="isActive"
                defaultChecked={category.isActive}
              />
              <Label htmlFor="isActive" className="normal-case">Activa</Label>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </AnimatedPageShell>
  );
}
