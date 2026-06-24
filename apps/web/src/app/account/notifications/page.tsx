import { redirect } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import { getSession } from '@/lib/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { NotificationPreferencesForm } from '@/components/account/notification-preferences-form';
import { WebPushOptIn } from '@/components/account/web-push-opt-in';
import type { NotificationPreferences } from '@repo/shared-types';

export default async function NotificationPreferencesPage() {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in?redirect_url=/account/notifications');
  }

  const api = await getServerApiClient();
  const initialPreferences = await api.notifications.preferences
    .get()
    .catch(
      (): NotificationPreferences => ({
        emailOptOut: false,
        marketingEmailOptOut: false,
        whatsappOptOut: false,
      }),
    );

  return (
    <AnimatedPageShell
      className="container mx-auto max-w-2xl px-4 py-8"
      header={
        <header className="mb-6 border-b-[6px] border-neo-onyx pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Mi cuenta
          </p>
          <h1 className="font-anton text-4xl uppercase md:text-5xl">Notificaciones</h1>
        </header>
      }
    >
      <Card className="brutalist-card">
        <CardHeader>
          <CardTitle>Preferencias de notificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm initialPreferences={initialPreferences} />
          <WebPushOptIn />
        </CardContent>
      </Card>
    </AnimatedPageShell>
  );
}
