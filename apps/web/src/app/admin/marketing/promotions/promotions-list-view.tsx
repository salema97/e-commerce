'use client';

import * as React from 'react';
import Link from 'next/link';
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
import type { Promotion, PromotionType } from '@repo/shared-types';
import { PromotionForm } from './promotion-form';

type PromotionRow = Promotion & {
  _count?: { coupons: number; discountRules: number };
};

const TYPE_LABELS: Record<PromotionType, string> = {
  PERCENTAGE: 'Porcentaje',
  FIXED_AMOUNT: 'Monto fijo',
  FREE_SHIPPING: 'Envío gratis',
  BUNDLE: 'Bundle',
  TIERED: 'Escalonada',
};

interface PromotionsListViewProps {
  initialPromotions: PromotionRow[];
}

export function PromotionsListView({ initialPromotions }: PromotionsListViewProps) {
  const api = useApiClient();
  const hooks = useApiQueryHooks();
  const authReady = useAuthApiReady();
  const [activeFilter, setActiveFilter] = React.useState<string>('all');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Promotion | null>(null);

  const filters = React.useMemo(() => {
    const f: { isActive?: boolean; type?: PromotionType } = {};
    if (activeFilter === 'active') f.isActive = true;
    if (activeFilter === 'inactive') f.isActive = false;
    if (typeFilter !== 'all') f.type = typeFilter as PromotionType;
    return f;
  }, [activeFilter, typeFilter]);

  const { data: promotions } = useQuery({
    queryKey: ['promotions', filters],
    queryFn: () => api.promotions.findAll(filters),
    initialData: initialPromotions,
    enabled: authReady,
  });

  const updateMutation = hooks.useUpdatePromotion();
  const deleteMutation = hooks.useDeletePromotion();

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(promotion: Promotion) {
    setEditing(promotion);
    setFormOpen(true);
  }

  function handleToggleActive(promotion: Promotion) {
    updateMutation.mutate({
      id: promotion.id,
      data: { isActive: !promotion.isActive },
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar esta promoción? Se eliminarán sus cupones y reglas.')) return;
    deleteMutation.mutate(id);
  }

  function formatWindow(startsAt?: string | null, endsAt?: string | null) {
    if (!startsAt && !endsAt) return '—';
    const start = startsAt ? new Date(startsAt).toLocaleDateString('es-EC') : '…';
    const end = endsAt ? new Date(endsAt).toLocaleDateString('es-EC') : '…';
    return `${start} → ${end}`;
  }

  return (
    <AnimatedPageShell
      className="flex min-h-0 flex-1 flex-col gap-6"
      header={
        <AdminPageHeader
          title="Promociones"
          subtitle="Marketing / Cupones y reglas de descuento"
          showNetworkStatus={false}
        />
      }
    >
      <div className="flex flex-wrap items-end gap-3">
        <FormSelect
          id="filter-active"
          value={activeFilter}
          onValueChange={setActiveFilter}
          placeholder="Estado"
          options={[
            { value: 'all', label: 'Todas' },
            { value: 'active', label: 'Activas' },
            { value: 'inactive', label: 'Inactivas' },
          ]}
        />
        <FormSelect
          id="filter-type"
          value={typeFilter}
          onValueChange={setTypeFilter}
          placeholder="Tipo"
          options={[
            { value: 'all', label: 'Todos los tipos' },
            ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        <Button type="button" onClick={openCreate}>
          Nueva promoción
        </Button>
      </div>

      <div className="neo-panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead>Cupones</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(promotions ?? []).map((promotion) => {
              const row = promotion as PromotionRow;
              return (
              <TableRow key={promotion.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/marketing/promotions/${promotion.id}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {promotion.name}
                  </Link>
                </TableCell>
                <TableCell>{TYPE_LABELS[promotion.type] ?? promotion.type}</TableCell>
                <TableCell>
                  {promotion.value != null
                    ? promotion.type === 'PERCENTAGE'
                      ? `${promotion.value}%`
                      : `$${promotion.value}`
                    : '—'}
                </TableCell>
                <TableCell className="text-sm">
                  {formatWindow(promotion.startsAt, promotion.endsAt)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{row._count?.coupons ?? 0}</Badge>
                </TableCell>
                <TableCell>{promotion.isActive ? 'Activa' : 'Inactiva'}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button type="button" size="sm" variant="outline" onClick={() => openEdit(promotion)}>
                    Editar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(promotion)}
                    disabled={updateMutation.isPending}
                  >
                    {promotion.isActive ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(promotion.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <PromotionForm
        open={formOpen}
        promotion={editing}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />
    </AnimatedPageShell>
  );
}
