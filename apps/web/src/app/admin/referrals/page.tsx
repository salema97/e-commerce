import { getServerApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@repo/shared-utils';
import { ReferralsAdminPanel } from './referrals-admin-panel';

export default async function AdminReferralsPage() {
  const api = await getServerApiClient();
  const report = await api.referrals.adminPerformance();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Programa de referidos</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversiones</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{report.totalConversions}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Comisión pendiente</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatPrice(report.pendingCommission)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Comisión pagada</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatPrice(report.paidCommission)}
          </CardContent>
        </Card>
      </div>

      <ReferralsAdminPanel initialReport={report} />
    </div>
  );
}
