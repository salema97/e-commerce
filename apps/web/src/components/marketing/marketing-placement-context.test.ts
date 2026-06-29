import { describe, it, expect, beforeEach } from 'vitest';
import {
  dismissKey,
  isPlacementDismissed,
  persistPlacementDismiss,
} from './marketing-placement-context';
import type { MarketingPlacementPublic } from '@repo/shared-types';

const placement: MarketingPlacementPublic = {
  id: 'p-test',
  type: 'POPUP',
  slot: 'APP_LAUNCH',
  title: 'Test',
  priority: 1,
  contentVersion: 2,
  showOncePerSession: false,
  showOnceEver: false,
  dismissible: true,
};

describe('marketing placement dismiss', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('uses versioned dismiss key', () => {
    expect(dismissKey(placement)).toBe('marketing:dismissed:p-test:2');
  });

  it('persists dismiss in localStorage by content version', () => {
    persistPlacementDismiss(placement);
    expect(isPlacementDismissed(placement)).toBe(true);
    expect(localStorage.getItem('marketing:dismissed:p-test:2')).toBe('1');
  });

  it('uses session storage when showOncePerSession is true', () => {
    const sessionPlacement = { ...placement, showOncePerSession: true };
    persistPlacementDismiss(sessionPlacement);
    expect(sessionStorage.getItem('marketing:dismissed:p-test:session')).toBe('1');
    expect(isPlacementDismissed(sessionPlacement)).toBe(true);
  });
});
