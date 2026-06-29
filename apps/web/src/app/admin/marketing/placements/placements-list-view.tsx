'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiClient, useApiQueryHooks, useAuthApiReady } from '@/lib/client-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FormSelect } from '@/components/ui/form-select';
import type { MarketingPlacement } from '@repo/shared-types';
import { PlacementForm } from './placement-form';

interface PlacementsListViewProps {
  initialPlacements: MarketingPlacement[];
}

export function PlacementsListView({ initialPlacements }: PlacementsListViewProps) {
  const api = useApiClient();
  const hooks = useApiQueryHooks();
  const authReady = useAuthApiReady();
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [slotFilter, setSlotFilter] = React.useState<string>('all');
  const [platformFilter, setPlatformFilter] = React.useState<string>('all');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<MarketingPlacement | null>(null);

  const filters = React.useMemo(() => {
    const f: Record<string, string | boolean> = {};
    if (typeFilter !== 'all') f.type = typeFilter;
    if (slotFilter !== 'all') f.slot = slotFilter;
    if (platformFilter !== 'all') f.platform = platformFilter;
    return f;
  }, [typeFilter, slotFilter, platformFilter]);

  const { data: placements } = useQuery({
    queryKey: ['marketing', 'placements', 'admin', filters],
    queryFn: () => api.marketing.listPlacementsAdmin(filters),
    initialData: initialPlacements,
    enabled: authReady,
  });

  const updateMutation = hooks.useUpdateMarketingPlacement();
  const deleteMutation = hooks.useDeleteMarketingPlacement();

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(placement: MarketingPlacement) {
    setEditing(placement);
    setFormOpen(true);
  }

  function handleToggleActive(placement: MarketingPlacement) {
    updateMutation.mutate({
      id: placement.id,
      data: { isActive: !placement.isActive },
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar este placement?')) return;
    deleteMutation.mutate(id);
  }

  return (
    <AnimatedPageShell
      className="flex min-h-0 flex-1 flex-col gap-6"
      header={
        <AdminPageHeader
          title="Popups y banners"
          subtitle="Marketing / Placements configurables para web y mobile"
          showNetworkStatus={false}
        />
      }
    >
      <div className="flex flex-wrap items-end gap-3">
        <FormSelect
          id="filter-type"
          value={typeFilter}
          onValueChange={setTypeFilter}
          placeholder="Tipo"
          options={[
            { value: 'all', label: 'Todos los tipos' },
            { value: 'POPUP', label: 'Popup' },
            { value: 'BANNER', label: 'Banner' },
            { value: 'PROMO_STRIP', label: 'Promo strip' },
          ]}
        />
        <FormSelect
          id="filter-slot"
          value={slotFilter}
          onValueChange={setSlotFilter}
          placeholder="Slot"
          options={[
            { value: 'all', label: 'Todos los slots' },
            { value: 'APP_LAUNCH', label: 'App launch' },
            { value: 'HOME_HERO', label: 'Home hero' },
            { value: 'STORE_TOP', label: 'Store top' },
            { value: 'STORE_INLINE', label: 'Store inline' },
          ]}
        />
        <FormSelect
          id="filter-platform"
          value={platformFilter}
          onValueChange={setPlatformFilter}
          placeholder="Plataforma"
          options={[
            { value: 'all', label: 'Todas' },
            { value: 'WEB', label: 'Web' },
            { value: 'MOBILE', label: 'Mobile' },
            { value: 'ALL', label: 'Todas (ALL)' },
          ]}
        />
        <Button type="button" onClick={openCreate}>
          Nuevo placement
        </Button>
      </div>

      <div className="neo-panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Slot</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(placements ?? []).map((placement) => (
              <TableRow key={placement.id}>
                <TableCell className="font-medium">{placement.name}</TableCell>
                <TableCell>{placement.type}</TableCell>
                <TableCell className="font-mono text-xs">{placement.slot}</TableCell>
                <TableCell>{placement.platform}</TableCell>
                <TableCell>
                  <Badge variant="outline">{placement.priority}</Badge>
                </TableCell>
                <TableCell>{placement.isActive ? 'Activo' : 'Inactivo'}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button type="button" size="sm" variant="outline" onClick={() => openEdit(placement)}>
                    Editar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(placement)}
                    disabled={updateMutation.isPending}
                  >
                    {placement.isActive ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(placement.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PlacementForm
        open={formOpen}
        placement={editing}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />
    </AnimatedPageShell>
  );
}
