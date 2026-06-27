import type { EcommerceAnalyticsEventName } from '@repo/shared-types';
import { getOrCreateSessionId } from './session';
import { hasAnalyticsConsent, hasRecordingConsent } from './consent';

type PostHogClient = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  init: (key: string, options?: Record<string, unknown>) => void;
  identify: (id: string) => void;
  isFeatureEnabled: (flag: string) => boolean;
};

let posthog: PostHogClient | null = null;
let initialized = false;

function getAnalyticsApiBase(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/v1`;
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || 'http://localhost:3001/v1';
}

function isConfiguredPostHogKey(key: string | undefined): key is string {
  if (!key) return false;
  const normalized = key.trim();
  if (!normalized || normalized.includes('xxx')) return false;
  return normalized.startsWith('phc_');
}

export async function initAnalytics(userId?: string): Promise<void> {
  if (initialized || !hasAnalyticsConsent()) {
    return;
  }
  initialized = true;

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (isConfiguredPostHogKey(posthogKey)) {
    const mod = await import('posthog-js');
    posthog = mod.default as PostHogClient;
    posthog.init(posthogKey, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      persistence: 'localStorage',
      capture_pageview: true,
    });
    if (userId) {
      posthog.identify(userId);
    }
  }

  if (hasRecordingConsent()) {
    loadClarity();
  }
}

function loadClarity(): void {
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  if (!clarityId || typeof window === 'undefined') {
    return;
  }
  const w = window as Window & { clarity?: (...args: unknown[]) => void };
  if (w.clarity) {
    return;
  }
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${clarityId}`;
  document.head.appendChild(script);
  w.clarity = (...args: unknown[]) => {
    (w as Window & { clarity?: { q?: unknown[] } }).clarity =
      (w as Window & { clarity?: { q?: unknown[] } }).clarity ?? { q: [] };
    const clarityObj = (w as Window & { clarity?: { q?: unknown[] } }).clarity as { q: unknown[] };
    clarityObj.q = clarityObj.q ?? [];
    clarityObj.q.push(args);
  };
}

export async function trackEvent(
  event: EcommerceAnalyticsEventName,
  properties?: Record<string, unknown>,
  userId?: string,
): Promise<void> {
  if (!hasAnalyticsConsent()) {
    return;
  }

  const payload = {
    event,
    properties,
    sessionId: getOrCreateSessionId(),
    userId,
    source: 'web' as const,
  };

  posthog?.capture(event, properties);

  try {
    await fetch(`${getAnalyticsApiBase()}/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Analytics must not break UX.
  }
}

export function isFeatureEnabled(flag: string): boolean {
  if (!posthog) {
    return false;
  }
  return posthog.isFeatureEnabled(flag) ?? false;
}

export function reportClientError(message: string, context?: Record<string, unknown>): void {
  void fetch(`${getAnalyticsApiBase()}/analytics/errors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      sessionId: getOrCreateSessionId(),
      context,
    }),
    keepalive: true,
  }).catch(() => undefined);
}
