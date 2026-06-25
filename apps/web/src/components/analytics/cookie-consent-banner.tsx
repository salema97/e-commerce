'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    <Dialog open={visible}>
      <DialogContent
        className="fixed bottom-4 top-auto max-h-none w-[calc(100%-2rem)] max-w-3xl -translate-y-0 gap-0 p-0 sm:bottom-6 [&>button]:hidden"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b-[3px] border-neo-onyx bg-neo-gold px-6 py-4 text-left">
          <DialogTitle id="cookie-consent-title" className="text-base">
            Preferencias de cookies
          </DialogTitle>
          <DialogDescription className="text-left">
            Usamos cookies necesarias para el funcionamiento del sitio. Puedes permitir analítica
            (PostHog) y grabación de sesiones (Microsoft Clarity) para mejorar la experiencia.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 px-6 py-4 text-sm">
          <div className="flex items-center gap-2">
            <Checkbox id="cookie-necessary" checked disabled />
            <Label htmlFor="cookie-necessary" className="cursor-default font-medium normal-case">
              Necesarias (siempre activas)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="cookie-analytics"
              checked={prefs.analytics}
              onCheckedChange={(checked) =>
                setPrefs((current) => ({ ...current, analytics: checked === true }))
              }
            />
            <Label htmlFor="cookie-analytics" className="cursor-pointer font-medium normal-case">
              Analítica de producto
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="cookie-recording"
              checked={prefs.recording}
              onCheckedChange={(checked) =>
                setPrefs((current) => ({ ...current, recording: checked === true }))
              }
            />
            <Label htmlFor="cookie-recording" className="cursor-pointer font-medium normal-case">
              Grabación de sesión y mapas de calor
            </Label>
          </div>
        </div>
        <DialogFooter className="border-t-[3px] border-neo-onyx px-6 py-4 sm:justify-start">
          <Button size="sm" onClick={acceptAll}>
            Aceptar todo
          </Button>
          <Button size="sm" variant="secondary" onClick={acceptSelected}>
            Guardar selección
          </Button>
          <Button size="sm" variant="outline" onClick={rejectOptional}>
            Solo necesarias
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
