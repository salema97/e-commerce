'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiClient } from '@/lib/client-api';
import type { Inventory } from '@repo/shared-types';

export default function EditInventoryPage({ item }: { item: Inventory }) {
  const router = useRouter();
  const api = useApiClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      await api.inventory.update(item.id, {
        quantity: Number(formData.get('quantity')),
        reservedQuantity: Number(formData.get('reservedQuantity')) || 0,
        lowStockThreshold: Number(formData.get('lowStockThreshold')) || undefined,
      });
      router.push('/admin/inventory');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Editar inventario</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Entrada de stock</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  defaultValue={item.quantity}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reservedQuantity">Reservado</Label>
                <Input
                  id="reservedQuantity"
                  name="reservedQuantity"
                  type="number"
                  defaultValue={item.reservedQuantity}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lowStockThreshold">Umbral de stock bajo</Label>
                <Input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  defaultValue={item.lowStockThreshold ?? ''}
                />
              </div>
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
    </div>
  );
}
