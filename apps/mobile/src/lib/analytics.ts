import type { EcommerceAnalyticsEventName } from '@repo/shared-types';
import { captureMobileException } from './sentry.js';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1';

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
    await fetch(`${API_BASE}/analytics/events`, {
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
