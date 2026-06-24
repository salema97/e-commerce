import { getServerApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PosAdminPanel } from './pos-admin-panel';

export default async function AdminPosPage() {
  const api = getServerApiClient();
  const locations = await api.pos.listLocations();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">POS y tiendas</h1>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Ubicaciones activas</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{locations.length}</CardContent>
      </Card>
      <PosAdminPanel initialLocations={locations} />
    </div>
  );
}
