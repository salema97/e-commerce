'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getStoredConsent } from '@/lib/analytics/consent';
import { initAnalytics, reportClientError } from '@/lib/analytics/track';
import { CookieConsentBanner } from '@/components/analytics/cookie-consent-banner';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (getStoredConsent()) {
      void initAnalytics(userId ?? undefined).finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, [userId]);

  React.useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (!getStoredConsent()?.analytics) {
        return;
      }
      reportClientError(event.message, { filename: event.filename, lineno: event.lineno });
    };
    window.addEventListener('error', onError);
    return () => window.removeEventListener('error', onError);
  }, []);

  return (
    <>
      {children}
      {ready ? <CookieConsentBanner onConsent={() => void initAnalytics(userId ?? undefined)} /> : null}
    </>
  );
}
