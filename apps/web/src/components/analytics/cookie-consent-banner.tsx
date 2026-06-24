'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DEFAULT_CONSENT,
  getStoredConsent,
  saveConsent,
  type ConsentPreferences,
} from '@/lib/analytics/consent';

function subscribeConsentStorage() {
  return () => {};
}

export function CookieConsentBanner({ onConsent }: { onConsent: () => void }) {
  const needsConsent = React.useSyncExternalStore(
    subscribeConsentStorage,
    () => getStoredConsent() === null,
    () => false,
  );
  const [dismissed, setDismissed] = React.useState(false);
  const visible = needsConsent && !dismissed;
  const [prefs, setPrefs] = React.useState<ConsentPreferences>(DEFAULT_CONSENT);

  if (!visible) {
    return null;
  }

  function acceptAll() {
    const all: ConsentPreferences = { necessary: true, analytics: true, recording: true };
    saveConsent(all);
    setDismissed(true);
    onConsent();
  }

  function acceptSelected() {
    saveConsent(prefs);
    setDismissed(true);
    onConsent();
  }

  function rejectOptional() {
    saveConsent(DEFAULT_CONSENT);
    setDismissed(true);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <Card className="mx-auto max-w-3xl border shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Preferencias de cookies</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            Usamos cookies necesarias para el funcionamiento del sitio. Puedes permitir analítica
            (PostHog) y grabación de sesiones (Microsoft Clarity) para mejorar la experiencia.
          </p>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked disabled readOnly />
            <span>Necesarias (siempre activas)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs.analytics}
              onChange={(e) => setPrefs((current) => ({ ...current, analytics: e.target.checked }))}
            />
            <span>Analítica de producto</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs.recording}
              onChange={(e) => setPrefs((current) => ({ ...current, recording: e.target.checked }))}
            />
            <span>Grabación de sesión y mapas de calor</span>
          </label>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button size="sm" onClick={acceptAll}>
            Aceptar todo
          </Button>
          <Button size="sm" variant="secondary" onClick={acceptSelected}>
            Guardar selección
          </Button>
          <Button size="sm" variant="outline" onClick={rejectOptional}>
            Solo necesarias
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
