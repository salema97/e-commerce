'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useApiClient, useAuthApiReady } from '@/lib/client-api';
import { useAuth } from '@/contexts/auth-context';
import type { NotificationPreferences } from '@repo/shared-types';

interface NotificationPreferencesFormProps {
  initialPreferences: NotificationPreferences;
}

export function NotificationPreferencesForm({
  initialPreferences,
}: NotificationPreferencesFormProps): React.ReactElement {
  const api = useApiClient();
  const authReady = useAuthApiReady();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => api.notifications.preferences.get(),
    initialData: initialPreferences,
    enabled: authReady && Boolean(user),
  });

  const mutation = useMutation({
    mutationFn: (payload: Partial<NotificationPreferences>) =>
      api.notifications.preferences.update(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['notification-preferences'], updated);
    },
  });

  if (!user || !data) {
    return <p className="text-muted-foreground">Inicia sesión para gestionar tus preferencias.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="email-opt-out">Emails transaccionales</Label>
          <p className="text-sm text-muted-foreground">
            Confirmaciones de pedido, envíos y reembolsos.
          </p>
        </div>
        <Checkbox
          id="email-opt-out"
          checked={!data.emailOptOut}
          onCheckedChange={(checked) =>
            mutation.mutate({ emailOptOut: checked !== true })
          }
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="marketing-opt-out">Emails de marketing</Label>
          <p className="text-sm text-muted-foreground">
            Promociones, carrito abandonado y recuperación.
          </p>
        </div>
        <Checkbox
          id="marketing-opt-out"
          checked={!data.marketingEmailOptOut}
          onCheckedChange={(checked) =>
            mutation.mutate({ marketingEmailOptOut: checked !== true })
          }
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="whatsapp-opt-out">WhatsApp</Label>
          <p className="text-sm text-muted-foreground">Notificaciones de pedido por WhatsApp.</p>
        </div>
        <Checkbox
          id="whatsapp-opt-out"
          checked={!data.whatsappOptOut}
          onCheckedChange={(checked) =>
            mutation.mutate({ whatsappOptOut: checked !== true })
          }
        />
      </div>

      {mutation.isSuccess ? (
        <p className="text-sm font-bold uppercase text-neo-green">Preferencias actualizadas.</p>
      ) : null}
    </div>
  );
}
