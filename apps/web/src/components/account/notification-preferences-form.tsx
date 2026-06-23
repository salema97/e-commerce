'use client';

import * as React from 'react';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useApiClient } from '@/lib/client-api';

export function NotificationPreferencesForm(): React.ReactElement {
  const api = useApiClient();
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => api.notifications.preferences.get(),
    enabled: isSignedIn,
  });

  const mutation = useMutation({
    mutationFn: (payload: {
      emailOptOut?: boolean;
      marketingEmailOptOut?: boolean;
      whatsappOptOut?: boolean;
    }) => api.notifications.preferences.update(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });

  if (!isSignedIn) {
    return <p className="text-muted-foreground">Inicia sesión para gestionar tus preferencias.</p>;
  }

  if (isLoading || !data) {
    return <p className="text-muted-foreground">Cargando preferencias…</p>;
  }

  return (
    <div className="space-y-6">
      <label className="flex items-center justify-between gap-4">
        <div>
          <Label>Emails transaccionales</Label>
          <p className="text-sm text-muted-foreground">Confirmaciones de pedido, envíos y reembolsos.</p>
        </div>
        <input
          type="checkbox"
          checked={!data.emailOptOut}
          onChange={(event) =>
            mutation.mutate({ emailOptOut: !event.target.checked })
          }
        />
      </label>

      <label className="flex items-center justify-between gap-4">
        <div>
          <Label>Emails de marketing</Label>
          <p className="text-sm text-muted-foreground">Promociones, carrito abandonado y win-back.</p>
        </div>
        <input
          type="checkbox"
          checked={!data.marketingEmailOptOut}
          onChange={(event) =>
            mutation.mutate({ marketingEmailOptOut: !event.target.checked })
          }
        />
      </label>

      <label className="flex items-center justify-between gap-4">
        <div>
          <Label>WhatsApp</Label>
          <p className="text-sm text-muted-foreground">Notificaciones de pedido por WhatsApp.</p>
        </div>
        <input
          type="checkbox"
          checked={!data.whatsappOptOut}
          onChange={(event) =>
            mutation.mutate({ whatsappOptOut: !event.target.checked })
          }
        />
      </label>

      {mutation.isSuccess ? (
        <p className="text-sm text-muted-foreground">Preferencias actualizadas.</p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        El restablecimiento de contraseña y la verificación de cuenta se gestionan con Clerk.
      </p>
    </div>
  );
}
