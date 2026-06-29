export type ConsentCategory = 'necessary' | 'analytics' | 'recording';

export interface ConsentPreferences {
  necessary: true;
  analytics: boolean;
  recording: boolean;
}

export const DEFAULT_CONSENT: ConsentPreferences = {
  necessary: true,
  analytics: false,
  recording: false,
};

const STORAGE_KEY = 'ecommerce-consent-v1';

export function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as ConsentPreferences;
  } catch {
    return null;
  }
}

export function saveConsent(preferences: ConsentPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('ecommerce-consent-change'));
  }
}

export function subscribeConsentChanges(onChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onChange();
    }
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener('ecommerce-consent-change', onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('ecommerce-consent-change', onChange);
  };
}

export function hasAnalyticsConsent(): boolean {
  return getStoredConsent()?.analytics === true;
}

export function hasRecordingConsent(): boolean {
  return getStoredConsent()?.recording === true;
}
