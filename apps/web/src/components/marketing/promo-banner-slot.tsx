'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMarketingPlacements } from './marketing-placement-context';
import type { MarketingPlacementPublic, MarketingPlacementSlot } from '@repo/shared-types';

interface PromoBannerSlotProps {
  slot: MarketingPlacementSlot;
  variant?: 'banner' | 'strip';
  className?: string;
}

function WebPromoBanner({
  placement,
  variant,
  onDismiss,
}: {
  placement: MarketingPlacementPublic;
  variant: 'banner' | 'strip';
  onDismiss: () => void;
}) {
  const router = useRouter();

  function handleCta() {
    const href = placement.ctaHref ?? (placement.promotionId ? '/store' : undefined);
    if (!href) return;
    if (href.startsWith('http')) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      router.push(href);
    }
  }

  return (
    <div className={variant === 'strip' ? 'w-full' : 'mb-6 w-full'}>
      <div className="neo-panel overflow-hidden p-0">
        {placement.imageUrl && variant === 'banner' ? (
          <img src={placement.imageUrl} alt="" className="h-40 w-full object-cover md:h-52" />
        ) : null}
        <div className={`flex flex-col gap-2 p-4 ${variant === 'strip' ? 'bg-neo-gold' : ''}`}>
          <h3 className="font-anton text-xl uppercase">{placement.title}</h3>
          {placement.body ? <p className="text-sm font-bold uppercase">{placement.body}</p> : null}
          <div className="flex gap-2">
            {placement.ctaLabel ? (
              <button
                type="button"
                className="neo-btn neo-btn-sm bg-neo-onyx text-white"
                onClick={handleCta}
              >
                {placement.ctaLabel}
              </button>
            ) : null}
            {placement.dismissible ? (
              <button type="button" className="neo-btn neo-btn-sm" onClick={onDismiss}>
                Cerrar
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PromoBannerSlot({ slot, variant = 'banner', className }: PromoBannerSlotProps) {
  const { getSlot, dismiss } = useMarketingPlacements();
  const bucket = getSlot(slot);

  const items =
    variant === 'strip'
      ? bucket.promoStrips
      : bucket.banners;

  if (items.length === 0) return null;

  return (
    <div className={className}>
      {items.map((placement) => (
        <WebPromoBanner
          key={placement.id}
          placement={placement}
          variant={variant}
          onDismiss={() => dismiss(placement)}
        />
      ))}
    </div>
  );
}
