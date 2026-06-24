import { redirect } from 'next/navigation';
import { getCurrentUser, financeRoles } from '@/lib/auth';
import { InvoiceDetailView } from './invoice-detail-view';

interface AdminInvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminInvoiceDetailPage({ params }: AdminInvoiceDetailPageProps) {
  const { id } = await params;
  const session = await getCurrentUser();

  if (!session || !financeRoles.includes(session.role)) {
    redirect('/sign-in?redirect_url=/admin/invoices');
  }

  return <InvoiceDetailView id={id} />;
}
