'use client';

import * as React from 'react';
import { useApiQueryHooks, useAuthApiReady } from '@/lib/client-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FormSelect } from '@/components/ui/form-select';
import type { MarketingSegment, Promotion } from '@repo/shared-types';

const SEGMENT_OPTIONS: { value: MarketingSegment; label: string }[] = [
  { value: 'ALL_CUSTOMERS', label: 'Todos los clientes' },
  { value: 'HAS_ACTIVE_CART', label: 'Carrito activo' },
  { value: 'RECENT_BUYERS', label: 'Compradores recientes' },
  { value: 'INACTIVE_BUYERS', label: 'Compradores inactivos' },
];

export function MarketingCampaignsView({
  initialPromotions,
}: {
  initialPromotions: Array<Pick<Promotion, 'id' | 'name'>>;
}) {
  const hooks = useApiQueryHooks();
  const authReady = useAuthApiReady();
  const [segment, setSegment] = React.useState<MarketingSegment>('ALL_CUSTOMERS');
  const [promotionId, setPromotionId] = React.useState(initialPromotions[0]?.id ?? '');

  const promotionsQuery = hooks.useMarketingPromotions({
    initialData: initialPromotions,
    enabled: authReady,
  });

  const distributePromo = hooks.useDistributePromo();

  const promotions = promotionsQuery.data ?? initialPromotions;
  const selectedPromotionId = promotionId || promotions[0]?.id || '';

  function handleDistribute(): void {
    if (!selectedPromotionId) return;
    distributePromo.mutate({ segment, promotionId: selectedPromotionId });
  }

  return (
    <AnimatedPageShell className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        title="Marketing"
        subtitle="Campañas / Distribución de promociones"
        showNetworkStatus={false}
      />

      <div className="neo-panel grid max-w-xl gap-4 p-4">
        <div className="space-y-2">
          <Label htmlFor="promotion">Promoción</Label>
          <FormSelect
            id="promotion"
            value={selectedPromotionId}
            onValueChange={setPromotionId}
            placeholder="Selecciona una promoción"
            options={promotions.map((promotion) => ({
              value: promotion.id,
              label: promotion.name,
            }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="segment">Segmento</Label>
          <FormSelect
            id="segment"
            value={segment}
            onValueChange={(value) => setSegment(value as MarketingSegment)}
            options={SEGMENT_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
        </div>

        <Button
          type="button"
          disabled={!selectedPromotionId || distributePromo.isPending}
          onClick={handleDistribute}
        >
          {distributePromo.isPending ? 'Encolando…' : 'Distribuir códigos promo'}
        </Button>

        {distributePromo.isSuccess ? (
          <p className="text-sm font-bold uppercase text-neo-green">
            Campaña encolada. Los correos se enviarán en segundo plano.
          </p>
        ) : null}

        {distributePromo.isError ? (
          <p className="text-sm font-bold text-destructive">
            No se pudo encolar la campaña. Intenta de nuevo.
          </p>
        ) : null}
      </div>
    </AnimatedPageShell>
  );
}
