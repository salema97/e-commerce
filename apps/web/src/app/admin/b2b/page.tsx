import { getServerApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { B2bAdminPanel } from './b2b-admin-panel';

export default async function AdminB2bPage() {
  const api = getServerApiClient();
  const companies = await api.b2b.listCompanies();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Cuentas B2B</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Empresas registradas</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{companies.length}</CardContent>
      </Card>

      <B2bAdminPanel initialCompanies={companies} />
    </div>
  );
}
