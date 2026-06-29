'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useApiQueryHooks } from '@/lib/client-api';
import { getStoredConsent, subscribeConsentChanges } from '@/lib/analytics/consent';
import {
  MarketingPlacementContext,
  isPlacementDismissed,
  persistPlacementDismiss,
} from './marketing-placement-context';
import { MarketingLaunchPopup } from './marketing-launch-popup';
import type { MarketingPlacementPublic, MarketingPlacementSlot, SlotActivePlacements } from '@repo/shared-types';

function emptySlot(): SlotActivePlacements {
  return { banners: [], promoStrips: [] };
}

export function MarketingPlacementProvider({ children }: { children: React.ReactNode }) {
  const hooks = useApiQueryHooks();
  const router = useRouter();
  const consentResolved = React.useSyncExternalStore(
    subscribeConsentChanges,
    () => getStoredConsent() !== null,
    () => false,
  );

  const { data, isLoading } = hooks.useActiveMarketingPlacements('WEB', {
    enabled: consentResolved,
  });

  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(new Set());
  const [, bump] = React.useReducer((n) => n + 1, 0);

  const dismiss = React.useCallback((placement: MarketingPlacementPublic) => {
    persistPlacementDismiss(placement);
    setDismissedIds((prev) => new Set(prev).add(placement.id));
    bump();
  }, []);

  const filterVisible = React.useCallback(
    (items: MarketingPlacementPublic[]) =>
      items.filter((p) => !dismissedIds.has(p.id) && !isPlacementDismissed(p)),
    [dismissedIds],
  );

  const getSlot = React.useCallback(
    (slot: MarketingPlacementSlot) => {
      const bucket = data?.[slot] ?? emptySlot();
      const popup =
        bucket.popup && !dismissedIds.has(bucket.popup.id) && !isPlacementDismissed(bucket.popup)
          ? bucket.popup
          : undefined;
      return {
        popup,
        banners: filterVisible(bucket.banners),
        promoStrips: filterVisible(bucket.promoStrips),
      };
    },
    [data, dismissedIds, filterVisible],
  );

  const launchPopup = getSlot('APP_LAUNCH').popup;

  const handleCta = React.useCallback(
    (placement: MarketingPlacementPublic) => {
      const href = placement.ctaHref ?? (placement.promotionId ? '/store' : undefined);
      if (!href) return;
      if (href.startsWith('http')) {
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        router.push(href);
      }
    },
    [router],
  );

  const value = React.useMemo(
    () => ({ data, isLoading, dismiss, getSlot }),
    [data, isLoading, dismiss, getSlot],
  );

  return (
    <MarketingPlacementContext.Provider value={value}>
      {children}
      {consentResolved && launchPopup ? (
        <MarketingLaunchPopup
          placement={launchPopup}
          onDismiss={() => dismiss(launchPopup)}
          onCta={() => {
            handleCta(launchPopup);
            dismiss(launchPopup);
          }}
        />
      ) : null}
    </MarketingPlacementContext.Provider>
  );
}
