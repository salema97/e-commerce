import { getServerApiClient } from '@/lib/api';
import { SubscriptionsAdminPanel } from './subscriptions-admin-panel';

export default async function AdminSubscriptionsPage() {
  const api = await getServerApiClient();
  const plans = await api.subscriptions.listPlans().catch(() => []);

  return <SubscriptionsAdminPanel initialPlans={plans} />;
}
