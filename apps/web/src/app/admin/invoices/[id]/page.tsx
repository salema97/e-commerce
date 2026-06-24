import { redirect, notFound } from 'next/navigation';
import { getCurrentUser, financeRoles } from '@/lib/auth';
import { getServerApiClient } from '@/lib/api';
import { InvoiceDetailView } from './invoice-detail-view';
import type { InvoiceResponseDto, Order } from '@repo/shared-types';

interface AdminInvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminInvoiceDetailPage({ params }: AdminInvoiceDetailPageProps) {
  const { id } = await params;
  const session = await getCurrentUser();

  if (!session || !financeRoles.includes(session.role)) {
    redirect('/sign-in?redirect_url=/admin/invoices');
  }

  const api = await getServerApiClient();
  let invoice: InvoiceResponseDto | null = await api.invoices.findOne(id).catch(() => null);
  let order: Order | null = null;

  if (invoice?.orderId) {
    order = await api.orders.findOne(invoice.orderId).catch(() => null);
  }

  if (!invoice) {
    notFound();
  }

  return <InvoiceDetailView id={id} initialInvoice={invoice} initialOrder={order} />;
}
