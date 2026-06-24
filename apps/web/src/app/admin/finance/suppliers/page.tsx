import { getServerApiClient } from '@/lib/api';
import { requireFinanceAccess } from '@/lib/finance-page';
import { SuppliersView } from './suppliers-view';
import type { Supplier } from '@repo/shared-types';

export default async function AdminFinanceSuppliersPage() {
  await requireFinanceAccess('/admin/finance/suppliers');
  const api = await getServerApiClient();
  const initialSuppliers = await api.suppliers.findAll().catch(() => [] as Supplier[]);

  return <SuppliersView initialSuppliers={initialSuppliers} />;
}
