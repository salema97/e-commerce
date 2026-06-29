import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MarketingPlacementPublic } from '@repo/shared-types';

const DISMISS_PREFIX = 'marketing:dismissed';

export function dismissKey(placement: MarketingPlacementPublic): string {
  return `${DISMISS_PREFIX}:${placement.id}:${placement.contentVersion}`;
}

export async function isPlacementDismissed(
  placement: MarketingPlacementPublic,
): Promise<boolean> {
  if (placement.showOnceEver) {
    return (await AsyncStorage.getItem(`${DISMISS_PREFIX}:${placement.id}:ever`)) === '1';
  }
  if (placement.showOncePerSession) {
    return (await AsyncStorage.getItem(`${DISMISS_PREFIX}:${placement.id}:session`)) === '1';
  }
  return (await AsyncStorage.getItem(dismissKey(placement))) === '1';
}

export async function persistPlacementDismiss(
  placement: MarketingPlacementPublic,
): Promise<void> {
  if (placement.showOnceEver) {
    await AsyncStorage.setItem(`${DISMISS_PREFIX}:${placement.id}:ever`, '1');
    return;
  }
  if (placement.showOncePerSession) {
    await AsyncStorage.setItem(`${DISMISS_PREFIX}:${placement.id}:session`, '1');
    return;
  }
  await AsyncStorage.setItem(dismissKey(placement), '1');
}

const MOBILE_CTA_PREFIXES = ['/(tabs)/', '/product/', '/store'] as const;

export function isAllowedMobileCta(href: string): boolean {
  return MOBILE_CTA_PREFIXES.some((prefix) => href.startsWith(prefix));
}

export function shouldFetchMobilePlacements(consentResolved: boolean): boolean {
  return consentResolved;
}

export function shouldRenderMobileLaunchPopup(input: {
  consentResolved: boolean;
  launchPopup?: MarketingPlacementPublic;
  popupReady: boolean;
}): boolean {
  return Boolean(
    input.consentResolved && input.launchPopup && input.popupReady,
  );
}
