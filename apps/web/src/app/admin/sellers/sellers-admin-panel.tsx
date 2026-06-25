'use client';

import { useReducer } from 'react';
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
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Badge } from '@/components/ui/badge';
import { useApiClient } from '@/lib/client-api';
import type { Seller } from '@repo/shared-types';

interface SellersAdminPanelProps {
  initialSellers: Seller[];
}

type SellersPanelState = {
  sellers: Seller[];
  userId: string;
  businessName: string;
  slug: string;
  pending: boolean;
};

type SellersPanelAction =
  | { type: 'set_user_id'; value: string }
  | { type: 'set_business_name'; value: string }
  | { type: 'set_slug'; value: string }
  | { type: 'submit_start' }
  | { type: 'submit_success'; sellers: Seller[] }
  | { type: 'submit_end' };

function sellersPanelReducer(state: SellersPanelState, action: SellersPanelAction): SellersPanelState {
  switch (action.type) {
    case 'set_user_id':
      return { ...state, userId: action.value };
    case 'set_business_name':
      return { ...state, businessName: action.value };
    case 'set_slug':
      return { ...state, slug: action.value };
    case 'submit_start':
      return { ...state, pending: true };
    case 'submit_success':
      return {
        ...state,
        sellers: action.sellers,
        userId: '',
        businessName: '',
        slug: '',
        pending: false,
      };
    case 'submit_end':
      return { ...state, pending: false };
    default:
      return state;
  }
}

export function SellersAdminPanel({ initialSellers }: SellersAdminPanelProps) {
  const api = useApiClient();
  const router = useRouter();
  const [state, dispatch] = useReducer(sellersPanelReducer, {
    sellers: initialSellers,
    userId: '',
    businessName: '',
    slug: '',
    pending: false,
  });

  async function createSeller() {
    if (!state.userId.trim() || !state.businessName.trim() || !state.slug.trim()) return;
    dispatch({ type: 'submit_start' });
    try {
      await api.sellers.create({
        userId: state.userId.trim(),
        businessName: state.businessName.trim(),
        slug: state.slug.trim(),
      });
      const refreshed = await api.sellers.list();
      dispatch({ type: 'submit_success', sellers: refreshed });
      router.refresh();
    } catch {
      dispatch({ type: 'submit_end' });
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8">
      <AdminPageHeader
        eyebrow="Ventas"
        title="Vendedores"
        subtitle="Cuentas de vendedores del marketplace interno."
        metrics={[{ label: 'Registrados', value: String(state.sellers.length) }]}
      />
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <Input
            value={state.userId}
            onChange={(e) => dispatch({ type: 'set_user_id', value: e.target.value })}
            placeholder="User ID"
          />
          <Input
            value={state.businessName}
            onChange={(e) => dispatch({ type: 'set_business_name', value: e.target.value })}
            placeholder="Nombre comercial"
          />
          <Input
            value={state.slug}
            onChange={(e) => dispatch({ type: 'set_slug', value: e.target.value })}
            placeholder="slug-tienda"
          />
        </div>
        <Button type="button" onClick={() => void createSeller()} disabled={state.pending}>
          Registrar vendedor
        </Button>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tienda</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Comisión</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.sellers.map((seller) => (
                <TableRow key={seller.id}>
                  <TableCell>{seller.businessName}</TableCell>
                  <TableCell>{seller.slug}</TableCell>
                  <TableCell>{seller.commissionRate}%</TableCell>
                  <TableCell>
                    <Badge variant={seller.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {seller.status}
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
