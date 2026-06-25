import { redirect } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import { getSession } from '@/lib/session';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { AccountSubscriptionsPanel } from './account-subscriptions-panel';
import type { CustomerSubscription, SubscriptionPlan } from '@repo/shared-types';

export default async function AccountSubscriptionsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in?redirect_url=/account/subscriptions');
  }

  const api = await getServerApiClient();
  const [subscriptions, plans] = await Promise.all([
    api.subscriptions.mine().catch((): CustomerSubscription[] => []),
    api.subscriptions.listPlans().catch((): SubscriptionPlan[] => []),
  ]);

  return (
    <AnimatedPageShell
      className="container mx-auto max-w-3xl px-4 py-8"
      header={
        <header className="mb-6 border-b-[6px] border-neo-onyx pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Mi cuenta
          </p>
          <h1 className="font-anton text-4xl uppercase md:text-5xl">Suscripciones</h1>
        </header>
      }
    >
      <AccountSubscriptionsPanel initialSubscriptions={subscriptions} initialPlans={plans} />
    </AnimatedPageShell>
  );
}
