import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationPreferencesForm } from '@/components/account/notification-preferences-form';

export default async function NotificationPreferencesPage() {
  const { userId } = await auth();
  if (!userId) {
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
