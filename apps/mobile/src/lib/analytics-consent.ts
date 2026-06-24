import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'ecommerce-analytics-consent-v1';

export interface AnalyticsConsentPreferences {
  analytics: boolean;
}

export const DEFAULT_ANALYTICS_CONSENT: AnalyticsConsentPreferences = {
  analytics: false,
};

export async function getStoredAnalyticsConsent(): Promise<AnalyticsConsentPreferences | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AnalyticsConsentPreferences;
  } catch {
    return null;
  }
}

export async function saveAnalyticsConsent(
  preferences: AnalyticsConsentPreferences,
): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(preferences));
}

export async function hasAnalyticsConsent(): Promise<boolean> {
  const stored = await getStoredAnalyticsConsent();
  return stored?.analytics === true;
}
