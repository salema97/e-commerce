import { getServerApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SellersAdminPanel } from './sellers-admin-panel';

export default async function AdminSellersPage() {
  const api = getServerApiClient();
  const sellers = await api.sellers.list();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Marketplace interno — vendedores</h1>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Vendedores registrados</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{sellers.length}</CardContent>
      </Card>
      <SellersAdminPanel initialSellers={sellers} />
    </div>
  );
}
