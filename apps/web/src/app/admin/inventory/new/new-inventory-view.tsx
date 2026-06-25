'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { useApiClient } from '@/lib/client-api';

export function NewInventoryView() {
  const router = useRouter();
  const api = useApiClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      await api.inventory.create({
        productId: String(formData.get('productId')),
        variantId: String(formData.get('variantId')) || undefined,
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
    <AnimatedPageShell className="flex flex-col gap-6">
      <AdminPageHeader
        title="Agregar inventario"
        subtitle="Inventario / Nueva entrada"
        showNetworkStatus={false}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Entrada de stock</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="productId">ID del producto</Label>
              <Input id="productId" name="productId" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="variantId">ID de variante (opcional)</Label>
              <Input id="variantId" name="variantId" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input id="quantity" name="quantity" type="number" defaultValue={0} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reservedQuantity">Reservado</Label>
                <Input
                  id="reservedQuantity"
                  name="reservedQuantity"
                  type="number"
                  defaultValue={0}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lowStockThreshold">Umbral de stock bajo</Label>
                <Input id="lowStockThreshold" name="lowStockThreshold" type="number" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Guardar stock'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </AnimatedPageShell>
  );
}
