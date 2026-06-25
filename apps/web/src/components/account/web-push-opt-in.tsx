'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useApiQueryHooks } from '@/lib/client-api';

const STORAGE_KEY = 'neo-store-web-push-token';

function getOrCreateWebPushToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const token = `web-${crypto.randomUUID()}`;
  window.localStorage.setItem(STORAGE_KEY, token);
  return token;
}

export function WebPushOptIn(): React.ReactElement {
  const hooks = useApiQueryHooks();
  const registerToken = hooks.useRegisterPushToken();
  const removeToken = hooks.useRemovePushToken();
  const [enabled, setEnabled] = React.useState(() =>
    typeof window !== 'undefined' ? Boolean(window.localStorage.getItem(STORAGE_KEY)) : false,
  );
  const [message, setMessage] = React.useState<string | null>(null);

  async function handleToggle(checked: boolean): Promise<void> {
    setMessage(null);

    if (checked) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setMessage('Permiso de notificaciones denegado en el navegador.');
          return;
        }
      }

      const token = getOrCreateWebPushToken();
      await registerToken.mutateAsync({ token, platform: 'web' });
      setEnabled(true);
      setMessage('Notificaciones push activadas en este dispositivo.');
      return;
    }

    const token = window.localStorage.getItem(STORAGE_KEY);
    if (token) {
      await removeToken.mutateAsync(token).catch(() => undefined);
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setEnabled(false);
    setMessage('Notificaciones push desactivadas.');
  }

  return (
    <div className="space-y-3 border-t border-neo-onyx/10 pt-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="web-push-opt-in">Notificaciones push (PWA)</Label>
          <p className="text-sm text-muted-foreground">
            Alertas de pedido y promociones en este navegador.
          </p>
        </div>
        <Checkbox
          id="web-push-opt-in"
          checked={enabled}
          disabled={registerToken.isPending || removeToken.isPending}
          onCheckedChange={(checked) => void handleToggle(checked === true)}
        />
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
