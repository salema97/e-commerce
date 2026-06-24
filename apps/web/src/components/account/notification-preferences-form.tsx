'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { useApiClient, useAuthApiReady } from '@/lib/client-api';
import { useAuth } from '@/contexts/auth-context';

export function NotificationPreferencesForm(): React.ReactElement {
  const api = useApiClient();
  const authReady = useAuthApiReady();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => api.notifications.preferences.get(),
    enabled: authReady && Boolean(user),
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

  if (!user) {
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
          <p className="text-sm text-muted-foreground">
            Confirmaciones de pedido, envíos y reembolsos.
          </p>
        </div>
        <input
          type="checkbox"
          checked={!data.emailOptOut}
          onChange={(event) => mutation.mutate({ emailOptOut: !event.target.checked })}
        />
      </label>

      <label className="flex items-center justify-between gap-4">
        <div>
          <Label>Emails de marketing</Label>
          <p className="text-sm text-muted-foreground">
            Promociones, carrito abandonado y recuperación.
          </p>
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
          onChange={(event) => mutation.mutate({ whatsappOptOut: !event.target.checked })}
        />
      </label>

      {mutation.isSuccess ? (
        <p className="text-sm text-muted-foreground">Preferencias actualizadas.</p>
      ) : null}
    </div>
  );
}
