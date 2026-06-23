import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getCurrentRole, financeRoles } from '@/lib/auth';
import { getTestAuthSession } from '@/lib/test-auth';
import { InvoiceListView } from './invoice-list-view';

export default async function AdminInvoicesPage() {
  const { userId } = await auth();
  const role = await getCurrentRole();
  const testSession = await getTestAuthSession();
  const effectiveRole = role ?? testSession?.role;
  const effectiveUserId = userId ?? testSession?.userId;

  if (!effectiveUserId || !effectiveRole || !financeRoles.includes(effectiveRole)) {
    redirect('/sign-in?redirect_url=/admin/invoices');
  }

  return <InvoiceListView />;
}
