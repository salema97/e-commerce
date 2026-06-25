import { redirect } from 'next/navigation';
import { getCurrentUser, financeRoles } from '@/lib/auth';
import { getServerApiClient } from '@/lib/api';
import { CreditNotesView } from './credit-notes-view';
import type { CreditNoteResponse } from '@repo/shared-types';

export default async function AdminCreditNotesPage() {
  const session = await getCurrentUser();

  if (!session || !financeRoles.includes(session.role)) {
    redirect('/sign-in?redirect_url=/admin/invoices/credit-notes');
  }

  const api = await getServerApiClient();
  const initialCreditNotes = await api.creditNotes
    .findAll({ limit: 20, offset: 0 })
    .catch(() => [] as CreditNoteResponse[]);

  return <CreditNotesView initialCreditNotes={initialCreditNotes} />;
}
