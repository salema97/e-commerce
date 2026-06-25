import { getServerApiClient } from '@/lib/api';
import { PosAdminPanel } from './pos-admin-panel';

export default async function AdminPosPage() {
  const api = await getServerApiClient();
  const locations = await api.pos.listLocations().catch(() => []);

  return <PosAdminPanel initialLocations={locations} />;
}
