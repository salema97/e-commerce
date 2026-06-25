import { redirect, notFound } from 'next/navigation';
import { getCurrentUser, financeRoles } from '@/lib/auth';
import { getServerApiClient } from '@/lib/api';
import { InvoiceDetailView } from './invoice-detail-view';
import type { InvoiceResponseDto, Order } from '@repo/shared-types';

interface AdminInvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminInvoiceDetailPage({ params }: AdminInvoiceDetailPageProps) {
  const [{ id }, session, api] = await Promise.all([
    params,
    getCurrentUser(),
    getServerApiClient(),
  ]);

  if (!session || !financeRoles.includes(session.role)) {
    redirect('/sign-in?redirect_url=/admin/invoices');
  }

  const invoice: InvoiceResponseDto | null = await api.invoices.findOne(id).catch(() => null);
  const order: Order | null = invoice?.orderId
    ? await api.orders.findOne(invoice.orderId).catch(() => null)
    : null;

  if (!invoice) {
    notFound();
  }

  return <InvoiceDetailView id={id} initialInvoice={invoice} initialOrder={order} />;
}
