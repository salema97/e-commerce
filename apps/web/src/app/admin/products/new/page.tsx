'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiClient } from '@/lib/client-api';
import type { ProductStatus } from '@repo/shared-types';

export default function NewProductPage() {
  const router = useRouter();
  const api = useApiClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      await api.products.create({
        name: String(formData.get('name')),
        slug: String(formData.get('slug')),
        description: String(formData.get('description')),
        sku: String(formData.get('sku')),
        status: String(formData.get('status')) as ProductStatus,
        price: Number(formData.get('price')),
        compareAtPrice: Number(formData.get('compareAtPrice')) || undefined,
        cost: Number(formData.get('cost')) || undefined,
        isFeatured: formData.get('isFeatured') === 'on',
      });
      router.push('/admin/products');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Agregar producto</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalles del producto</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">URL amigable</Label>
              <Input id="slug" name="slug" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Estado</Label>
              <Select id="status" name="status" defaultValue="DRAFT">
                <option value="DRAFT">Borrador</option>
                <option value="ACTIVE">Activo</option>
                <option value="ARCHIVED">Archivado</option>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Precio</Label>
                <Input id="price" name="price" type="number" step="0.01" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="compareAtPrice">Precio de comparación</Label>
                <Input id="compareAtPrice" name="compareAtPrice" type="number" step="0.01" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cost">Costo</Label>
                <Input id="cost" name="cost" type="number" step="0.01" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input id="isFeatured" name="isFeatured" type="checkbox" />
              <Label htmlFor="isFeatured">Producto destacado</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Guardar producto'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
