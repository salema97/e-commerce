import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MarketingPlacementPublic } from '@repo/shared-types';

const storage = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      storage.delete(key);
    }),
  },
}));

import {
  dismissKey,
  isPlacementDismissed,
  persistPlacementDismiss,
  shouldFetchMobilePlacements,
  shouldRenderMobileLaunchPopup,
} from './marketing-dismiss';

const placement: MarketingPlacementPublic = {
  id: 'p-mobile',
  type: 'POPUP',
  slot: 'APP_LAUNCH',
  title: 'Test',
  priority: 1,
  contentVersion: 3,
  showOncePerSession: false,
  showOnceEver: false,
  dismissible: true,
};

describe('marketing-dismiss', () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  it('uses versioned dismiss key', () => {
    expect(dismissKey(placement)).toBe('marketing:dismissed:p-mobile:3');
  });

  it('persists dismiss in AsyncStorage', async () => {
    await persistPlacementDismiss(placement);
    expect(await isPlacementDismissed(placement)).toBe(true);
  });
});

describe('mobile marketing consent gate', () => {
  it('does not fetch placements before consent', () => {
    expect(shouldFetchMobilePlacements(false)).toBe(false);
    expect(shouldFetchMobilePlacements(true)).toBe(true);
  });

  it('does not render popup before consent', () => {
    expect(
      shouldRenderMobileLaunchPopup({
        consentResolved: false,
        launchPopup: placement,
        popupReady: true,
      }),
    ).toBe(false);
  });

  it('renders popup after consent when ready', () => {
    expect(
      shouldRenderMobileLaunchPopup({
        consentResolved: true,
        launchPopup: placement,
        popupReady: true,
      }),
    ).toBe(true);
  });
});
