import { redirect } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import { getSession } from '@/lib/session';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { AccountLoyaltyPanel } from './account-loyalty-panel';
import type { LoyaltyAccount, LoyaltyTransaction } from '@repo/shared-types';

export default async function AccountLoyaltyPage() {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in?redirect_url=/account/loyalty');
  }

  const api = await getServerApiClient();
  const [account, transactions] = await Promise.all([
    api.loyalty.me().catch((): LoyaltyAccount | null => null),
    api.loyalty.transactions().catch((): LoyaltyTransaction[] => []),
  ]);

  return (
    <AnimatedPageShell
      className="container mx-auto max-w-2xl px-4 py-8"
      header={
        <header className="mb-6 border-b-[6px] border-neo-onyx pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Mi cuenta
          </p>
          <h1 className="font-anton text-4xl uppercase md:text-5xl">Programa de lealtad</h1>
        </header>
      }
    >
      <AccountLoyaltyPanel initialAccount={account} initialTransactions={transactions} />
    </AnimatedPageShell>
  );
}
