'use client';

import * as React from 'react';
import type {
  ActivePlacementsResponse,
  MarketingPlacementPublic,
  MarketingPlacementSlot,
} from '@repo/shared-types';

const DISMISS_PREFIX = 'marketing:dismissed';

export function dismissKey(placement: MarketingPlacementPublic): string {
  return `${DISMISS_PREFIX}:${placement.id}:${placement.contentVersion}`;
}

export function isPlacementDismissed(placement: MarketingPlacementPublic): boolean {
  if (typeof window === 'undefined') return false;
  if (placement.showOnceEver) {
    return localStorage.getItem(`${DISMISS_PREFIX}:${placement.id}:ever`) === '1';
  }
  if (placement.showOncePerSession) {
    return sessionStorage.getItem(`${DISMISS_PREFIX}:${placement.id}:session`) === '1';
  }
  return localStorage.getItem(dismissKey(placement)) === '1';
}

export function persistPlacementDismiss(placement: MarketingPlacementPublic): void {
  if (typeof window === 'undefined') return;
  if (placement.showOnceEver) {
    localStorage.setItem(`${DISMISS_PREFIX}:${placement.id}:ever`, '1');
    return;
  }
  if (placement.showOncePerSession) {
    sessionStorage.setItem(`${DISMISS_PREFIX}:${placement.id}:session`, '1');
    return;
  }
  localStorage.setItem(dismissKey(placement), '1');
}

interface MarketingPlacementContextValue {
  data: ActivePlacementsResponse | undefined;
  isLoading: boolean;
  dismiss: (placement: MarketingPlacementPublic) => void;
  getSlot: (slot: MarketingPlacementSlot) => {
    popup?: MarketingPlacementPublic;
    banners: MarketingPlacementPublic[];
    promoStrips: MarketingPlacementPublic[];
  };
}

const MarketingPlacementContext = React.createContext<MarketingPlacementContextValue | null>(null);

export function useMarketingPlacements() {
  const ctx = React.useContext(MarketingPlacementContext);
  if (!ctx) {
    throw new Error('useMarketingPlacements must be used within MarketingPlacementProvider');
  }
  return ctx;
}

export { MarketingPlacementContext };
