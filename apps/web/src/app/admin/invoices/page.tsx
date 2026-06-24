import { redirect } from 'next/navigation';
import { getCurrentUser, financeRoles } from '@/lib/auth';
import { InvoiceListView } from './invoice-list-view';

export default async function AdminInvoicesPage() {
  const session = await getCurrentUser();

  if (!session || !financeRoles.includes(session.role)) {
    redirect('/sign-in?redirect_url=/admin/invoices');
  }

  return <InvoiceListView />;
}
