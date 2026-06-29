'use client';

import * as React from 'react';
import { useApiQueryHooks } from '@/lib/client-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FormSelect } from '@/components/ui/form-select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {
  MarketingPlacement,
  MarketingPlacementSlot,
  MarketingPlacementType,
} from '@repo/shared-types';

interface PlacementFormProps {
  open: boolean;
  placement: MarketingPlacement | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TYPE_OPTIONS = [
  { value: 'POPUP', label: 'Popup' },
  { value: 'BANNER', label: 'Banner' },
  { value: 'PROMO_STRIP', label: 'Promo strip' },
];

const SLOT_OPTIONS = [
  { value: 'APP_LAUNCH', label: 'App launch' },
  { value: 'HOME_HERO', label: 'Home hero' },
  { value: 'STORE_TOP', label: 'Store top' },
  { value: 'STORE_INLINE', label: 'Store inline' },
];

const PLATFORM_OPTIONS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'WEB', label: 'Web' },
  { value: 'MOBILE', label: 'Mobile' },
];

function defaultSlotForType(type: MarketingPlacementType): MarketingPlacementSlot {
  return type === 'POPUP' ? 'APP_LAUNCH' : 'HOME_HERO';
}

export function PlacementForm({ open, placement, onOpenChange, onSuccess }: PlacementFormProps) {
  const hooks = useApiQueryHooks();
  const promotionsQuery = hooks.useMarketingPromotions({ enabled: open });
  const createMutation = hooks.useCreateMarketingPlacement({ onSuccess });
  const updateMutation = hooks.useUpdateMarketingPlacement({ onSuccess });

  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<MarketingPlacementType>('BANNER');
  const [slot, setSlot] = React.useState<MarketingPlacementSlot>('HOME_HERO');
  const [platform, setPlatform] = React.useState('ALL');
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [ctaLabel, setCtaLabel] = React.useState('');
  const [ctaHref, setCtaHref] = React.useState('');
  const [promotionId, setPromotionId] = React.useState('');
  const [priority, setPriority] = React.useState('0');
  const [isActive, setIsActive] = React.useState(true);
  const [showOncePerSession, setShowOncePerSession] = React.useState(false);
  const [showOnceEver, setShowOnceEver] = React.useState(false);
  const [dismissible, setDismissible] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (placement) {
      setName(placement.name);
      setType(placement.type);
      setSlot(placement.slot);
      setPlatform(placement.platform);
      setTitle(placement.title);
      setBody(placement.body ?? '');
      setImageUrl(placement.imageUrl ?? '');
      setCtaLabel(placement.ctaLabel ?? '');
      setCtaHref(placement.ctaHref ?? '');
      setPromotionId(placement.promotionId ?? '');
      setPriority(String(placement.priority));
      setIsActive(placement.isActive);
      setShowOncePerSession(placement.showOncePerSession);
      setShowOnceEver(placement.showOnceEver);
      setDismissible(placement.dismissible);
    } else {
      setName('');
      setType('BANNER');
      setSlot('HOME_HERO');
      setPlatform('ALL');
      setTitle('');
      setBody('');
      setImageUrl('');
      setCtaLabel('');
      setCtaHref('');
      setPromotionId('');
      setPriority('0');
      setIsActive(true);
      setShowOncePerSession(false);
      setShowOnceEver(false);
      setDismissible(true);
    }
    setError(null);
  }, [open, placement]);

  function handleTypeChange(value: string) {
    const nextType = value as MarketingPlacementType;
    setType(nextType);
    if (nextType === 'POPUP') {
      setSlot('APP_LAUNCH');
    } else if (slot === 'APP_LAUNCH') {
      setSlot(defaultSlotForType(nextType));
    }
  }

  const slotOptions =
    type === 'POPUP'
      ? SLOT_OPTIONS.filter((o) => o.value === 'APP_LAUNCH')
      : SLOT_OPTIONS.filter((o) => o.value !== 'APP_LAUNCH');

  const pending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(): void {
    setError(null);
    if (!name.trim() || !title.trim()) return;

    const payload = {
      name: name.trim(),
      type,
      slot,
      platform: platform as 'WEB' | 'MOBILE' | 'ALL',
      title: title.trim(),
      body: body.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      ctaLabel: ctaLabel.trim() || undefined,
      ctaHref: ctaHref.trim() || undefined,
      promotionId: promotionId || undefined,
      priority: Number(priority) || 0,
      isActive,
      showOncePerSession,
      showOnceEver,
      dismissible,
    };

    if (placement) {
      updateMutation.mutate(
        { id: placement.id, data: payload },
        { onError: (e) => setError(e.message) },
      );
    } else {
      createMutation.mutate(payload, { onError: (e) => setError(e.message) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{placement ? 'Editar placement' : 'Nuevo placement'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="placement-name">Nombre interno</Label>
            <Input id="placement-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="placement-type">Tipo</Label>
            <FormSelect id="placement-type" value={type} onValueChange={handleTypeChange} options={TYPE_OPTIONS} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="placement-slot">Slot</Label>
            <FormSelect id="placement-slot" value={slot} onValueChange={(v) => setSlot(v as MarketingPlacementSlot)} options={slotOptions} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="placement-platform">Plataforma</Label>
            <FormSelect id="placement-platform" value={platform} onValueChange={setPlatform} options={PLATFORM_OPTIONS} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="placement-priority">Prioridad</Label>
            <Input id="placement-priority" type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="placement-title">Título</Label>
            <Input id="placement-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="placement-body">Cuerpo</Label>
            <Textarea id="placement-body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="placement-image">URL imagen</Label>
            <Input id="placement-image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="placement-cta-label">CTA label</Label>
            <Input id="placement-cta-label" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="placement-cta-href">CTA href</Label>
            <Input id="placement-cta-href" value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} placeholder="/store" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="placement-promotion">Promoción vinculada</Label>
            <FormSelect
              id="placement-promotion"
              value={promotionId || 'none'}
              onValueChange={(v) => setPromotionId(v === 'none' ? '' : v)}
              placeholder="Sin promoción"
              options={[
                { value: 'none', label: 'Sin promoción' },
                ...(promotionsQuery.data ?? []).map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>
          {placement ? (
            <div className="text-sm text-muted-foreground md:col-span-2">
              Versión de contenido: {placement.contentVersion}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <Checkbox id="placement-active" checked={isActive} onCheckedChange={(c) => setIsActive(c === true)} />
              <Label htmlFor="placement-active" className="normal-case">Activo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="placement-session" checked={showOncePerSession} onCheckedChange={(c) => setShowOncePerSession(c === true)} />
              <Label htmlFor="placement-session" className="normal-case">Una vez por sesión</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="placement-ever" checked={showOnceEver} onCheckedChange={(c) => setShowOnceEver(c === true)} />
              <Label htmlFor="placement-ever" className="normal-case">Una vez siempre</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="placement-dismiss" checked={dismissible} onCheckedChange={(c) => setDismissible(c === true)} />
              <Label htmlFor="placement-dismiss" className="normal-case">Dismissible</Label>
            </div>
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={pending} onClick={handleSubmit}>
            {pending ? 'Guardando…' : placement ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
