'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiClient } from '@/lib/client-api';
import type { CustomerSubscription, SubscriptionPlan } from '@repo/shared-types';

export function AccountSubscriptionsPanel() {
  const api = useApiClient();
  const [subscriptions, setSubscriptions] = useState<CustomerSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([api.subscriptions.mine(), api.subscriptions.listPlans()])
      .then(([mine, available]) => {
        setSubscriptions(mine);
        setPlans(available);
      })
      .finally(() => setLoading(false));
  }, [api]);

  async function startSubscribe(planId: string) {
    const { url } = await api.subscriptions.subscribe(planId);
    if (url) window.location.href = url;
  }

  async function openPortal() {
    const { url } = await api.subscriptions.portal();
    if (url) window.location.href = url;
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando suscripciones...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis suscripciones</h1>
        <Button type="button" variant="outline" onClick={() => void openPortal()}>
          Portal de facturación
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes suscripciones activas.</p>
          ) : (
            subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between border-b py-2 text-sm">
                <span>{(sub.plan as SubscriptionPlan | undefined)?.productId ?? sub.planId}</span>
                <span>{sub.status}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planes disponibles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="flex items-center justify-between">
              <span className="text-sm">{(plan.product as { name?: string } | undefined)?.name ?? plan.productId}</span>
              <Button type="button" size="sm" onClick={() => void startSubscribe(plan.id)}>
                Suscribirme
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Link href="/account" className="text-sm text-primary underline-offset-4 hover:underline">
        Volver a mi cuenta
      </Link>
    </div>
  );
}
