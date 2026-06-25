import { getServerApiClient } from '@/lib/api';
import { ReferralsAdminPanel } from './referrals-admin-panel';

export default async function AdminReferralsPage() {
  const api = await getServerApiClient();
  const report = await api.referrals.adminPerformance();

  return <ReferralsAdminPanel initialReport={report} />;
}
