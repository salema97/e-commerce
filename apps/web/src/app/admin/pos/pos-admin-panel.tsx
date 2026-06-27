'use client';

import { useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
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
import { useApiClient } from '@/lib/client-api';
import type { StoreLocation } from '@repo/shared-types';

interface PosAdminPanelProps {
  initialLocations: StoreLocation[];
}

type PosPanelState = {
  locations: StoreLocation[];
  code: string;
  name: string;
  address: string;
  pending: boolean;
};

type PosPanelAction =
  | { type: 'set_code'; value: string }
  | { type: 'set_name'; value: string }
  | { type: 'set_address'; value: string }
  | { type: 'submit_start' }
  | { type: 'submit_success'; locations: StoreLocation[] }
  | { type: 'submit_end' };

function posPanelReducer(state: PosPanelState, action: PosPanelAction): PosPanelState {
  switch (action.type) {
    case 'set_code':
      return { ...state, code: action.value };
    case 'set_name':
      return { ...state, name: action.value };
    case 'set_address':
      return { ...state, address: action.value };
    case 'submit_start':
      return { ...state, pending: true };
    case 'submit_success':
      return {
        ...state,
        locations: action.locations,
        code: '',
        name: '',
        address: '',
        pending: false,
      };
    case 'submit_end':
      return { ...state, pending: false };
    default:
      return state;
  }
}

export function PosAdminPanel({ initialLocations }: PosAdminPanelProps) {
  const api = useApiClient();
  const router = useRouter();
  const [state, dispatch] = useReducer(posPanelReducer, {
    locations: initialLocations,
    code: '',
    name: '',
    address: '',
    pending: false,
  });

  async function createLocation() {
    if (!state.code.trim() || !state.name.trim() || !state.address.trim()) return;
    dispatch({ type: 'submit_start' });
    try {
      await api.pos.createLocation({
        code: state.code.trim(),
        name: state.name.trim(),
        address: state.address.trim(),
        supportsPickup: true,
        supportsPos: true,
      });
      const refreshed = await api.pos.listLocations();
      dispatch({ type: 'submit_success', locations: refreshed });
      router.refresh();
    } catch {
      dispatch({ type: 'submit_end' });
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        eyebrow="Ventas"
        title="POS y tiendas"
        subtitle="Ubicaciones físicas para venta en tienda y retiro BOPIS."
        metrics={[{ label: 'Ubicaciones', value: String(state.locations.length) }]}
      />
      <div className="neo-panel grid gap-4 p-4 sm:grid-cols-3">
          <Input
            value={state.code}
            onChange={(e) => dispatch({ type: 'set_code', value: e.target.value })}
            placeholder="Código (ej. QUITO-01)"
          />
          <Input
            value={state.name}
            onChange={(e) => dispatch({ type: 'set_name', value: e.target.value })}
            placeholder="Nombre tienda"
          />
          <Input
            value={state.address}
            onChange={(e) => dispatch({ type: 'set_address', value: e.target.value })}
            placeholder="Dirección"
          />
          <div className="sm:col-span-3">
            <Button type="button" onClick={() => void createLocation()} disabled={state.pending}>
              Crear ubicación
            </Button>
          </div>
        </div>

      <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>POS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>{location.code}</TableCell>
                  <TableCell>{location.name}</TableCell>
                  <TableCell>{location.supportsPickup ? 'Sí' : 'No'}</TableCell>
                  <TableCell>{location.supportsPos ? 'Sí' : 'No'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
    </div>
  );
}
