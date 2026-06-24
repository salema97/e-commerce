import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ACCOUNT_LINKS = [
  { href: '/account/loyalty', label: 'Programa de lealtad' },
  { href: '/account/referrals', label: 'Invita y gana' },
  { href: '/account/quotes', label: 'Mis cotizaciones' },
  { href: '/account/privacy', label: 'Privacidad y datos' },
  { href: '/account/notifications', label: 'Preferencias de notificaciones' },
] as const;

export default async function AccountPage() {
  const session = await auth();
  if (!session.userId) {
    redirect('/sign-in?redirect_url=/account');
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Mi cuenta</h1>
      <Card>
        <CardHeader>
          <CardTitle>Accesos rápidos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {ACCOUNT_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-primary hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
