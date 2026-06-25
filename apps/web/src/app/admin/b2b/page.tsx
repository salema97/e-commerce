import { getServerApiClient } from '@/lib/api';
import { B2bAdminPanel } from './b2b-admin-panel';

export default async function AdminB2bPage() {
  const api = await getServerApiClient();
  const companies = await api.b2b.listCompanies().catch(() => []);

  return <B2bAdminPanel initialCompanies={companies} />;
}
