import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationPreferencesForm } from '@/components/account/notification-preferences-form';

export default async function NotificationPreferencesPage() {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in?redirect_url=/account/notifications');
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Preferencias de notificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm />
        </CardContent>
      </Card>
    </div>
  );
}
