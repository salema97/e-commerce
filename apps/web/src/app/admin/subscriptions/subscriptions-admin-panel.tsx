'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useApiClient } from '@/lib/client-api';
import type { SubscriptionPlan } from '@repo/shared-types';

interface SubscriptionsAdminPanelProps {
  initialPlans: SubscriptionPlan[];
}

export function SubscriptionsAdminPanel({ initialPlans }: SubscriptionsAdminPanelProps) {
  const api = useApiClient();
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [productId, setProductId] = useState('');
  const [stripePriceId, setStripePriceId] = useState('');
  const [pending, setPending] = useState(false);

  async function createPlan() {
    if (!productId.trim() || !stripePriceId.trim()) return;
    setPending(true);
    try {
      await api.subscriptions.createPlan({
        productId: productId.trim(),
        stripePriceId: stripePriceId.trim(),
        interval: 'MONTHLY',
      });
      const refreshed = await api.subscriptions.listPlans();
      setPlans(refreshed);
      setProductId('');
      setStripePriceId('');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        eyebrow="Ventas"
        title="Suscripciones"
        subtitle="Planes recurrentes con Stripe Billing."
        metrics={[{ label: 'Planes activos', value: String(plans.length) }]}
      />

      <div className="neo-panel grid gap-4 p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sub-product-id">Product ID</Label>
          <Input
            id="sub-product-id"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="UUID del producto"
            className="normal-case font-mono text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sub-stripe-price">Stripe Price ID</Label>
          <Input
            id="sub-stripe-price"
            value={stripePriceId}
            onChange={(e) => setStripePriceId(e.target.value)}
            placeholder="price_xxx"
            className="normal-case font-mono text-xs"
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="button" onClick={() => void createPlan()} disabled={pending}>
            Crear plan
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Intervalo</TableHead>
            <TableHead>Stripe Price</TableHead>
            <TableHead>Activo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell>
                {(plan.product as { name?: string } | undefined)?.name ?? plan.productId}
              </TableCell>
              <TableCell>{plan.interval}</TableCell>
              <TableCell className="font-mono text-xs">{plan.stripePriceId ?? '—'}</TableCell>
              <TableCell>{plan.isActive ? 'Sí' : 'No'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
