'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiClient } from '@/lib/client-api';
import type { CustomerSubscription, SubscriptionPlan } from '@repo/shared-types';

interface AccountSubscriptionsPanelProps {
  initialSubscriptions: CustomerSubscription[];
  initialPlans: SubscriptionPlan[];
}

export function AccountSubscriptionsPanel({
  initialSubscriptions,
  initialPlans,
}: AccountSubscriptionsPanelProps) {
  const api = useApiClient();

  async function startSubscribe(planId: string) {
    const { url } = await api.subscriptions.subscribe(planId);
    if (url) window.location.href = url;
  }

  async function openPortal() {
    const { url } = await api.subscriptions.portal();
    if (url) window.location.href = url;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => void openPortal()}>
          Portal de facturación
        </Button>
      </div>

      <Card className="brutalist-card">
        <CardHeader>
          <CardTitle>Activas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {initialSubscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes suscripciones activas.</p>
          ) : (
            initialSubscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between border-b py-2 text-sm">
                <span>{(sub.plan as SubscriptionPlan | undefined)?.productId ?? sub.planId}</span>
                <span>{sub.status}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="brutalist-card">
        <CardHeader>
          <CardTitle>Planes disponibles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {initialPlans.map((plan) => (
            <div key={plan.id} className="flex items-center justify-between gap-3">
              <span className="text-sm">
                {(plan.product as { name?: string } | undefined)?.name ?? plan.productId}
              </span>
              <Button type="button" size="sm" onClick={() => void startSubscribe(plan.id)}>
                Suscribirme
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Link href="/account" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        Volver a mi cuenta
      </Link>
    </div>
  );
}
