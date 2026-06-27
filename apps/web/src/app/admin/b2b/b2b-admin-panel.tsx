'use client';

import { useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

type B2bPanelState = {
  companies: Company[];
  name: string;
  taxId: string;
  pending: boolean;
  error: string | null;
};

type B2bPanelAction =
  | { type: 'set_name'; value: string }
  | { type: 'set_tax_id'; value: string }
  | { type: 'submit_start' }
  | { type: 'submit_success'; companies: Company[] }
  | { type: 'submit_error'; message: string };

function b2bPanelReducer(state: B2bPanelState, action: B2bPanelAction): B2bPanelState {
  switch (action.type) {
    case 'set_name':
      return { ...state, name: action.value };
    case 'set_tax_id':
      return { ...state, taxId: action.value };
    case 'submit_start':
      return { ...state, pending: true, error: null };
    case 'submit_success':
      return {
        ...state,
        companies: action.companies,
        name: '',
        taxId: '',
        pending: false,
        error: null,
      };
    case 'submit_error':
      return { ...state, pending: false, error: action.message };
    default:
      return state;
  }
}

export function B2bAdminPanel({ initialCompanies }: B2bAdminPanelProps) {
  const api = useApiClient();
  const router = useRouter();
  const [state, dispatch] = useReducer(b2bPanelReducer, {
    companies: initialCompanies,
    name: '',
    taxId: '',
    pending: false,
    error: null,
  });

  async function createCompany() {
    if (!state.name.trim() || !state.taxId.trim()) return;
    dispatch({ type: 'submit_start' });
    try {
      await api.b2b.createCompany({ name: state.name.trim(), taxId: state.taxId.trim() });
      const refreshed = await api.b2b.listCompanies();
      dispatch({ type: 'submit_success', companies: refreshed });
      router.refresh();
    } catch {
      dispatch({ type: 'submit_error', message: 'No se pudo crear la empresa.' });
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8">
      <AdminPageHeader
        eyebrow="Ventas"
        title="B2B"
        subtitle="Gestiona empresas, crédito y precios negociados."
        metrics={[{ label: 'Empresas', value: String(state.companies.length) }]}
      />
      <div className="flex flex-col gap-6">
        <div className="neo-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="b2b-company-name">Nombre</Label>
            <Input
              id="b2b-company-name"
              value={state.name}
              onChange={(e) => dispatch({ type: 'set_name', value: e.target.value })}
              placeholder="Empresa S.A."
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="b2b-company-tax-id">RUC</Label>
            <Input
              id="b2b-company-tax-id"
              value={state.taxId}
              onChange={(e) => dispatch({ type: 'set_tax_id', value: e.target.value })}
              placeholder="1790000000001"
            />
          </div>
          <Button type="button" onClick={() => void createCompany()} disabled={state.pending}>
            Crear empresa
          </Button>
        </div>

        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

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
            {state.companies.map((company) => (
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
  );
}
