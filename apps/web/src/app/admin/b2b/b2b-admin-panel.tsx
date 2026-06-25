'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { useApiClient } from '@/lib/client-api';
import type { Company } from '@repo/shared-types';

interface B2bAdminPanelProps {
  initialCompanies: Company[];
}

export function B2bAdminPanel({ initialCompanies }: B2bAdminPanelProps) {
  const api = useApiClient();
  const router = useRouter();
  const [companies, setCompanies] = useState(initialCompanies);
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createCompany() {
    if (!name.trim() || !taxId.trim()) return;
    setPending(true);
    setError(null);
    try {
      await api.b2b.createCompany({ name: name.trim(), taxId: taxId.trim() });
      const refreshed = await api.b2b.listCompanies();
      setCompanies(refreshed);
      setName('');
      setTaxId('');
      router.refresh();
    } catch {
      setError('No se pudo crear la empresa.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8">
      <AdminPageHeader
        eyebrow="Ventas"
        title="B2B"
        subtitle="Gestiona empresas, crédito y precios negociados."
        metrics={[{ label: 'Empresas', value: String(companies.length) }]}
      />
      <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <label htmlFor="b2b-company-name" className="text-sm font-medium">
            Nombre
          </label>
          <Input
            id="b2b-company-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Empresa S.A."
          />
        </div>
        <div className="flex-1 space-y-1">
          <label htmlFor="b2b-company-tax-id" className="text-sm font-medium">
            RUC
          </label>
          <Input
            id="b2b-company-tax-id"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder="1790000000001"
          />
        </div>
        <Button type="button" onClick={() => void createCompany()} disabled={pending}>
          Crear empresa
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>RUC</TableHead>
              <TableHead>Crédito</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>{company.taxId}</TableCell>
                <TableCell>{company.creditLimit != null ? `$${company.creditLimit}` : '—'}</TableCell>
                <TableCell>
                  <Badge variant={company.isActive ? 'default' : 'secondary'}>
                    {company.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </div>
    </div>
  );
}
