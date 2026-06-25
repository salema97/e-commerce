import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { AccountPrivacyView } from './privacy-view';

export default async function AccountPrivacyPage() {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in?redirect_url=/account/privacy');
  }

  return (
    <AnimatedPageShell
      className="container mx-auto max-w-2xl px-4 py-8"
      header={
        <header className="mb-6 border-b-[6px] border-neo-onyx pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Mi cuenta
          </p>
          <h1 className="font-anton text-4xl uppercase md:text-5xl">Privacidad y datos</h1>
        </header>
      }
    >
      <AccountPrivacyView />
    </AnimatedPageShell>
  );
}
