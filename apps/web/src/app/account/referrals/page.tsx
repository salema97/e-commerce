import { redirect } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import { getSession } from '@/lib/session';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { AccountReferralsPanel } from './account-referrals-panel';
import type { ReferralCode, ReferralPerformanceReport } from '@repo/shared-types';

export default async function AccountReferralsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in?redirect_url=/account/referrals');
  }

  const api = await getServerApiClient();
  const [code, report] = await Promise.all([
    api.referrals.myCode().catch((): ReferralCode | null => null),
    api.referrals.myPerformance().catch((): ReferralPerformanceReport | null => null),
  ]);

  return (
    <AnimatedPageShell
      className="container mx-auto max-w-2xl px-4 py-8"
      header={
        <header className="mb-6 border-b-[6px] border-neo-onyx pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Mi cuenta
          </p>
          <h1 className="font-anton text-4xl uppercase md:text-5xl">Invita y gana</h1>
        </header>
      }
    >
      <AccountReferralsPanel initialCode={code} initialReport={report} />
    </AnimatedPageShell>
  );
}
