'use client';

import * as React from 'react';
import { useApiQueryHooks } from '@/lib/client-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FormSelect } from '@/components/ui/form-select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Promotion, PromotionType } from '@repo/shared-types';

interface PromotionFormProps {
  open: boolean;
  promotion: Promotion | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TYPE_OPTIONS: { value: PromotionType; label: string }[] = [
  { value: 'PERCENTAGE', label: 'Porcentaje' },
  { value: 'FIXED_AMOUNT', label: 'Monto fijo' },
  { value: 'FREE_SHIPPING', label: 'Envío gratis' },
  { value: 'BUNDLE', label: 'Bundle' },
  { value: 'TIERED', label: 'Escalonada' },
];

function toDateInput(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

export function PromotionForm({ open, promotion, onOpenChange, onSuccess }: PromotionFormProps) {
  const hooks = useApiQueryHooks();
  const createMutation = hooks.useCreatePromotion({ onSuccess });
  const updateMutation = hooks.useUpdatePromotion({ onSuccess });

  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<PromotionType>('PERCENTAGE');
  const [value, setValue] = React.useState('');
  const [startsAt, setStartsAt] = React.useState('');
  const [endsAt, setEndsAt] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (promotion) {
      setName(promotion.name);
      setType(promotion.type);
      setValue(promotion.value != null ? String(promotion.value) : '');
      setStartsAt(toDateInput(promotion.startsAt));
      setEndsAt(toDateInput(promotion.endsAt));
      setIsActive(promotion.isActive);
    } else {
      setName('');
      setType('PERCENTAGE');
      setValue('');
      setStartsAt('');
      setEndsAt('');
      setIsActive(true);
    }
    setError(null);
  }, [open, promotion]);

  const needsValue = type === 'PERCENTAGE' || type === 'FIXED_AMOUNT' || type === 'BUNDLE';
  const optionalValue = type === 'TIERED';
  const pending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(): void {
    setError(null);
    if (!name.trim()) return;
    if (needsValue && !value.trim()) {
      setError('Este tipo de promoción requiere un valor.');
      return;
    }

    const payload = {
      name: name.trim(),
      type,
      value:
        needsValue || (optionalValue && value.trim())
          ? Number(value)
          : undefined,
      startsAt: startsAt ? `${startsAt}T00:00:00.000Z` : undefined,
      endsAt: endsAt ? `${endsAt}T23:59:59.999Z` : undefined,
      isActive,
    };

    if (promotion) {
      updateMutation.mutate(
        { id: promotion.id, data: payload },
        { onError: (e) => setError(e.message) },
      );
    } else {
      createMutation.mutate(payload, { onError: (e) => setError(e.message) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{promotion ? 'Editar promoción' : 'Nueva promoción'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="promotion-name">Nombre</Label>
            <Input id="promotion-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promotion-type">Tipo</Label>
            <FormSelect
              id="promotion-type"
              value={type}
              onValueChange={(v) => setType(v as PromotionType)}
              options={TYPE_OPTIONS}
            />
          </div>
          {needsValue || optionalValue ? (
            <div className="space-y-2">
              <Label htmlFor="promotion-value">
                {type === 'PERCENTAGE' || type === 'BUNDLE' || type === 'TIERED'
                  ? 'Porcentaje base'
                  : 'Monto'}
              </Label>
              <Input
                id="promotion-value"
                type="number"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              {type === 'BUNDLE' ? (
                <p className="text-xs text-muted-foreground">
                  Porcentaje aplicado al subtotal de los productos del bundle cuando se cumplen todas las reglas.
                </p>
              ) : null}
              {type === 'TIERED' ? (
                <p className="text-xs text-muted-foreground">
                  Porcentaje por defecto si un tramo no define su propio descuento.
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="promotion-starts">Inicio</Label>
              <Input
                id="promotion-starts"
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promotion-ends">Fin</Label>
              <Input
                id="promotion-ends"
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="promotion-active"
              checked={isActive}
              onCheckedChange={(c) => setIsActive(c === true)}
            />
            <Label htmlFor="promotion-active" className="normal-case">
              Activa
            </Label>
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={pending} onClick={handleSubmit}>
            {pending ? 'Guardando…' : promotion ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
