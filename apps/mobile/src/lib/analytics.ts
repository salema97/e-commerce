import type { EcommerceAnalyticsEventName } from '@repo/shared-types';
import { getApiBaseUrl } from './env';
import { hasAnalyticsConsent } from './analytics-consent';
import { captureMobileException } from './sentry';

let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  return sessionId;
}

export async function trackMobileEvent(
  event: EcommerceAnalyticsEventName,
  properties?: Record<string, unknown>,
  userId?: string,
): Promise<void> {
  try {
    const consented = await hasAnalyticsConsent();
    if (!consented) {
      return;
    }

    await fetch(`${getApiBaseUrl()}/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        properties,
        sessionId: getSessionId(),
        userId,
        source: 'mobile',
      }),
    });
  } catch (error) {
    captureMobileException(error, { event, source: 'mobile-analytics' });
  }
}
