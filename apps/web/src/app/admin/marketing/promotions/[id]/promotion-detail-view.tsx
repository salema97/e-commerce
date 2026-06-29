'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useApiClient, useApiQueryHooks, useAuthApiReady } from '@/lib/client-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
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
import type { Coupon, DiscountRule, Promotion } from '@repo/shared-types';
import { FormSelect } from '@/components/ui/form-select';
import { PromotionForm } from '../promotion-form';

interface PromotionDetailViewProps {
  initialPromotion: Promotion;
}

export function PromotionDetailView({ initialPromotion }: PromotionDetailViewProps) {
  const api = useApiClient();
  const hooks = useApiQueryHooks();
  const authReady = useAuthApiReady();
  const [editOpen, setEditOpen] = React.useState(false);
  const [couponCode, setCouponCode] = React.useState('');
  const [couponLimit, setCouponLimit] = React.useState('');
  const [ruleMinAmount, setRuleMinAmount] = React.useState('');
  const [ruleMinQty, setRuleMinQty] = React.useState('');
  const [ruleProductId, setRuleProductId] = React.useState('');
  const [ruleCategoryId, setRuleCategoryId] = React.useState('');
  const [ruleDiscountValue, setRuleDiscountValue] = React.useState('');

  const { data: promotion } = useQuery({
    queryKey: ['promotions', initialPromotion.id],
    queryFn: () => api.promotions.findOne(initialPromotion.id),
    initialData: initialPromotion,
    enabled: authReady,
  });

  const createCoupon = hooks.useCreatePromotionCoupon({
    onSuccess: () => {
      setCouponCode('');
      setCouponLimit('');
    },
  });
  const deleteCoupon = hooks.useDeletePromotionCoupon();
  const createRule = hooks.useCreatePromotionDiscountRule({
    onSuccess: () => {
      setRuleMinAmount('');
      setRuleMinQty('');
      setRuleProductId('');
      setRuleCategoryId('');
      setRuleDiscountValue('');
    },
  });
  const deleteRule = hooks.useDeletePromotionDiscountRule();

  const productsQuery = hooks.useProducts(undefined, { enabled: authReady });
  const categoriesQuery = hooks.useCategories({ enabled: authReady });

  const productNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const product of productsQuery.data ?? []) {
      map.set(product.id, product.name);
    }
    return map;
  }, [productsQuery.data]);

  const categoryNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categoriesQuery.data ?? []) {
      map.set(category.id, category.name);
    }
    return map;
  }, [categoriesQuery.data]);

  const productOptions = React.useMemo(
    () => [
      { value: '', label: 'Cualquier producto' },
      ...(productsQuery.data ?? []).map((product) => ({
        value: product.id,
        label: product.name,
      })),
    ],
    [productsQuery.data],
  );

  const categoryOptions = React.useMemo(
    () => [
      { value: '', label: 'Cualquier categoría' },
      ...(categoriesQuery.data ?? []).map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categoriesQuery.data],
  );

  if (!promotion) return null;

  const coupons = promotion.coupons ?? [];
  const rules = promotion.discountRules ?? [];

  function handleAddCoupon() {
    if (!couponCode.trim()) return;
    createCoupon.mutate({
      promotionId: promotion.id,
      data: {
        code: couponCode.trim(),
        usageLimit: couponLimit ? Number(couponLimit) : undefined,
      },
    });
  }

  function handleAddRule() {
    if (
      !ruleMinAmount.trim() &&
      !ruleMinQty.trim() &&
      !ruleProductId &&
      !ruleCategoryId
    ) {
      return;
    }
    createRule.mutate({
      promotionId: promotion.id,
      data: {
        minimumAmount: ruleMinAmount ? Number(ruleMinAmount) : undefined,
        minimumQuantity: ruleMinQty ? Number(ruleMinQty) : undefined,
        applicableProductId: ruleProductId || undefined,
        applicableCategoryId: ruleCategoryId || undefined,
        discountValue:
          promotion.type === 'TIERED' && ruleDiscountValue
            ? Number(ruleDiscountValue)
            : undefined,
      },
    });
  }

  function handleDeleteCoupon(coupon: Coupon) {
    if (!window.confirm(`¿Eliminar cupón ${coupon.code}?`)) return;
    deleteCoupon.mutate({ promotionId: promotion.id, couponId: coupon.id });
  }

  function handleDeleteRule(rule: DiscountRule) {
    if (!window.confirm('¿Eliminar esta regla?')) return;
    deleteRule.mutate({ promotionId: promotion.id, ruleId: rule.id });
  }

  return (
    <AnimatedPageShell
      className="flex min-h-0 flex-1 flex-col gap-6"
      header={
        <AdminPageHeader
          title={promotion.name}
          subtitle="Marketing / Detalle de promoción"
          showNetworkStatus={false}
        />
      }
    >
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/marketing/promotions"
          className="inline-flex h-11 items-center justify-center border-[3px] border-neo-onyx bg-white px-5 text-sm font-bold uppercase tracking-wide shadow-[4px_4px_0_0_#111111] hover:bg-neo-gold"
        >
          ← Volver al listado
        </Link>
        <Button type="button" onClick={() => setEditOpen(true)}>
          Editar promoción
        </Button>
      </div>

      <div className="neo-panel space-y-4 p-4">
        <h2 className="text-lg font-bold">Cupones</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="coupon-code">Código</Label>
            <Input
              id="coupon-code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="VERANO20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-limit">Límite de uso</Label>
            <Input
              id="coupon-limit"
              type="number"
              min="1"
              value={couponLimit}
              onChange={(e) => setCouponLimit(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleAddCoupon}
              disabled={createCoupon.isPending}
            >
              Añadir cupón
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-mono">{coupon.code}</TableCell>
                <TableCell>
                  {coupon.usageCount}
                  {coupon.usageLimit != null ? ` / ${coupon.usageLimit}` : ''}
                </TableCell>
                <TableCell>{coupon.isActive ? 'Activo' : 'Inactivo'}</TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteCoupon(coupon)}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="neo-panel space-y-4 p-4">
        <h2 className="text-lg font-bold">Reglas de descuento</h2>
        {promotion.type === 'TIERED' ? (
          <p className="text-sm text-muted-foreground">
            Define tramos con umbrales (cantidad o monto). Se aplica el tramo más alto que el carrito cumpla.
          </p>
        ) : null}
        {promotion.type === 'BUNDLE' ? (
          <p className="text-sm text-muted-foreground">
            Cada regla es un componente del bundle. El cliente debe cumplir todas para activar el descuento.
          </p>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="rule-min-amount">Monto mínimo</Label>
            <Input
              id="rule-min-amount"
              type="number"
              min="0"
              value={ruleMinAmount}
              onChange={(e) => setRuleMinAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rule-min-qty">Cantidad mínima</Label>
            <Input
              id="rule-min-qty"
              type="number"
              min="1"
              value={ruleMinQty}
              onChange={(e) => setRuleMinQty(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rule-product">Producto aplicable</Label>
            <FormSelect
              id="rule-product"
              value={ruleProductId}
              onValueChange={setRuleProductId}
              options={productOptions}
              placeholder="Cualquier producto"
              disabled={productsQuery.isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rule-category">Categoría aplicable</Label>
            <FormSelect
              id="rule-category"
              value={ruleCategoryId}
              onValueChange={setRuleCategoryId}
              options={categoryOptions}
              placeholder="Cualquier categoría"
              disabled={categoriesQuery.isLoading}
            />
          </div>
          {promotion.type === 'TIERED' ? (
            <div className="space-y-2">
              <Label htmlFor="rule-discount-value">Descuento del tramo (%)</Label>
              <Input
                id="rule-discount-value"
                type="number"
                min="0"
                max="100"
                value={ruleDiscountValue}
                onChange={(e) => setRuleDiscountValue(e.target.value)}
                placeholder="Opcional — usa % base"
              />
            </div>
          ) : null}
          <div className="flex items-end lg:col-span-2">
            <Button type="button" onClick={handleAddRule} disabled={createRule.isPending}>
              Añadir regla
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Monto mín.</TableHead>
              <TableHead>Cant. mín.</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              {promotion.type === 'TIERED' ? <TableHead>Descuento %</TableHead> : null}
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.minimumAmount ?? '—'}</TableCell>
                <TableCell>{rule.minimumQuantity ?? '—'}</TableCell>
                <TableCell>
                  {rule.applicableProductId
                    ? (productNameById.get(rule.applicableProductId) ?? rule.applicableProductId)
                    : '—'}
                </TableCell>
                <TableCell>
                  {rule.applicableCategoryId
                    ? (categoryNameById.get(rule.applicableCategoryId) ?? rule.applicableCategoryId)
                    : '—'}
                </TableCell>
                {promotion.type === 'TIERED' ? (
                  <TableCell>{rule.discountValue ?? promotion.value ?? '—'}</TableCell>
                ) : null}
                <TableCell className="text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteRule(rule)}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PromotionForm
        open={editOpen}
        promotion={promotion}
        onOpenChange={setEditOpen}
        onSuccess={() => setEditOpen(false)}
      />
    </AnimatedPageShell>
  );
}
