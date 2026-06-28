import { redirect } from 'next/navigation';
import { getCurrentUser, financeRoles } from '@/lib/auth';
import { getServerApiClient } from '@/lib/api';
import { InvoiceListView } from './invoice-list-view';
import { ADMIN_TABLE_PAGE_SIZE } from '@/lib/pagination';
import type { InvoiceResponseDto } from '@repo/shared-types';

export default async function AdminInvoicesPage() {
  const session = await getCurrentUser();

  if (!session || !financeRoles.includes(session.role)) {
    redirect('/sign-in?redirect_url=/admin/invoices');
  }

  const api = await getServerApiClient();
  let initialInvoices: InvoiceResponseDto[] = [];

  try {
    initialInvoices = await api.invoices.findAll({ limit: ADMIN_TABLE_PAGE_SIZE, offset: 0 });
  } catch {
    initialInvoices = [];
  }

  return <InvoiceListView initialInvoices={initialInvoices} />;
}
