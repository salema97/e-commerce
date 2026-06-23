import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getCurrentRole, financeRoles } from '@/lib/auth';
import { getTestAuthSession } from '@/lib/test-auth';
import { InvoiceDetailView } from './invoice-detail-view';

interface AdminInvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminInvoiceDetailPage({ params }: AdminInvoiceDetailPageProps) {
  const { id } = await params;
  const { userId } = await auth();
  const role = await getCurrentRole();
  const testSession = await getTestAuthSession();
  const effectiveRole = role ?? testSession?.role;
  const effectiveUserId = userId ?? testSession?.userId;

  if (!effectiveUserId || !effectiveRole || !financeRoles.includes(effectiveRole)) {
    redirect('/sign-in?redirect_url=/admin/invoices');
  }

  return <InvoiceDetailView id={id} />;
}
