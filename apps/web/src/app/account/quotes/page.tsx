import { getServerApiClient } from '@/lib/api';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { AccountQuotesView } from './account-quotes-view';

export default async function AccountQuotesPage() {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in?redirect_url=/account/quotes');
  }

  const api = await getServerApiClient();
  const initialQuotes = await api.quotes.mine().catch(() => []);

  return <AccountQuotesView initialQuotes={initialQuotes} />;
}
