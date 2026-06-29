import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useApiQueryHooks } from '../lib/api';
import { getStoredAnalyticsConsent } from '../lib/analytics-consent';
import {
  isAllowedMobileCta,
  isPlacementDismissed,
  persistPlacementDismiss,
  shouldRenderMobileLaunchPopup,
} from '../lib/marketing-dismiss';
import { MarketingLaunchPopup } from '../components/marketing/MarketingLaunchPopup';
import type {
  ActivePlacementsResponse,
  MarketingPlacementPublic,
  MarketingPlacementSlot,
  SlotActivePlacements,
} from '@repo/shared-types';

interface MarketingPlacementContextValue {
  data: ActivePlacementsResponse | undefined;
  isLoading: boolean;
  dismiss: (placement: MarketingPlacementPublic) => Promise<void>;
  getSlot: (slot: MarketingPlacementSlot) => {
    popup?: MarketingPlacementPublic;
    banners: MarketingPlacementPublic[];
    promoStrips: MarketingPlacementPublic[];
  };
}

const MarketingPlacementContext = createContext<MarketingPlacementContextValue | null>(null);

export function useMarketingPlacements(): MarketingPlacementContextValue {
  const ctx = useContext(MarketingPlacementContext);
  if (!ctx) {
    throw new Error('useMarketingPlacements must be used within MarketingPlacementProvider');
  }
  return ctx;
}

const sessionDismissed = new Set<string>();

function emptySlot(): SlotActivePlacements {
  return {
    banners: [],
    promoStrips: [],
  };
}

export function MarketingPlacementProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const hooks = useApiQueryHooks();
  const router = useRouter();
  const [consentResolved, setConsentResolved] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [visibilityTick, setVisibilityTick] = useState(0);

  useEffect(() => {
    void getStoredAnalyticsConsent().then((stored) => {
      if (stored) {
        setConsentResolved(true);
      }
    });
    const interval = setInterval(() => {
      void getStoredAnalyticsConsent().then((stored) => {
        if (stored) setConsentResolved(true);
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const { data, isLoading } = hooks.useActiveMarketingPlacements('MOBILE', {
    enabled: consentResolved,
  });

  const dismiss = useCallback(async (placement: MarketingPlacementPublic) => {
    await persistPlacementDismiss(placement);
    if (placement.showOncePerSession) {
      sessionDismissed.add(placement.id);
    }
    setDismissedIds((prev) => new Set(prev).add(placement.id));
    setVisibilityTick((n) => n + 1);
  }, []);

  const isVisible = useCallback(
    (placement: MarketingPlacementPublic) => {
      if (dismissedIds.has(placement.id) || sessionDismissed.has(placement.id)) {
        return false;
      }
      return true;
    },
    [dismissedIds, visibilityTick],
  );

  const getSlot = useCallback(
    (slot: MarketingPlacementSlot) => {
      const bucket = data?.[slot] ?? emptySlot();
      const popup = bucket.popup && isVisible(bucket.popup) ? bucket.popup : undefined;
      return {
        popup,
        banners: bucket.banners.filter(isVisible),
        promoStrips: bucket.promoStrips.filter(isVisible),
      };
    },
    [data, isVisible],
  );

  const launchPopup = getSlot('APP_LAUNCH').popup;
  const [popupReady, setPopupReady] = useState(false);

  useEffect(() => {
    if (!launchPopup) {
      setPopupReady(false);
      return;
    }
    void isPlacementDismissed(launchPopup).then((dismissed) => {
      setPopupReady(!dismissed);
    });
  }, [launchPopup]);

  const handleCta = useCallback(
    (placement: MarketingPlacementPublic) => {
      const href = placement.ctaHref ?? (placement.promotionId ? '/store' : undefined);
      if (!href || !isAllowedMobileCta(href)) return;
      router.push(href as never);
    },
    [router],
  );

  const value = useMemo(
    () => ({ data, isLoading, dismiss, getSlot }),
    [data, isLoading, dismiss, getSlot],
  );

  const showLaunchPopup = shouldRenderMobileLaunchPopup({
    consentResolved,
    launchPopup,
    popupReady,
  });

  return (
    <MarketingPlacementContext.Provider value={value}>
      {children}
      {showLaunchPopup && launchPopup ? (
        <MarketingLaunchPopup
          placement={launchPopup}
          onDismiss={() => void dismiss(launchPopup)}
          onCta={() => {
            handleCta(launchPopup);
            void dismiss(launchPopup);
          }}
        />
      ) : null}
    </MarketingPlacementContext.Provider>
  );
}
