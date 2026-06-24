import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import { getSession } from '@/lib/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { StoreCreditCard } from '@/components/account/store-credit-card';
import type { StoreCreditBalance } from '@repo/shared-types';

export default async function AccountPage() {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in?redirect_url=/account');
  }

  const api = await getServerApiClient();
  const initialBalance = await api.returns.myStoreCredit().catch(
    (): StoreCreditBalance | null => null,
  );

  return (
    <AnimatedPageShell
      className="container mx-auto max-w-2xl px-4 py-8"
      header={
        <header className="mb-6 border-b-[6px] border-neo-onyx pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Mi cuenta
          </p>
          <h1 className="font-anton text-4xl uppercase md:text-5xl">Cuenta</h1>
        </header>
      }
    >
      <div className="flex flex-col gap-6">
        <StoreCreditCard initialBalance={initialBalance} />

        <Card className="brutalist-card">
          <CardHeader>
            <CardTitle>Accesos rápidos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/orders" className={cn(buttonVariants({ variant: 'outline' }), 'justify-start')}>
              Mis pedidos
            </Link>
            <Link
              href="/account/notifications"
              className={cn(buttonVariants({ variant: 'outline' }), 'justify-start')}
            >
              Preferencias de notificaciones
            </Link>
            <Link href="/help" className={cn(buttonVariants({ variant: 'outline' }), 'justify-start')}>
              Preguntas frecuentes
            </Link>
            <Link href="/wishlist" className={cn(buttonVariants({ variant: 'outline' }), 'justify-start')}>
              Lista de deseos
            </Link>
          </CardContent>
        </Card>
      </div>
    </AnimatedPageShell>
  );
}
