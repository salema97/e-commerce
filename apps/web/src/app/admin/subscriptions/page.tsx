import { getServerApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionsAdminPanel } from './subscriptions-admin-panel';

export default async function AdminSubscriptionsPage() {
  const api = getServerApiClient();
  const plans = await api.subscriptions.listPlans();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Suscripciones</h1>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Planes activos</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{plans.length}</CardContent>
      </Card>
      <SubscriptionsAdminPanel initialPlans={plans} />
    </div>
  );
}
