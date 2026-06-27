'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { FormSelect } from '@/components/ui/form-select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AnimatedPageShell, NeoReveal } from '@/components/motion/neo-page-transition';
import { useApiClient, useAuthApiReady } from '@/lib/client-api';
import {
  formatPrice,
  returnStatusLabel,
  refundMethodLabel,
} from '@repo/shared-utils';
import type { ReturnRequest, RefundMethod, Product, ProductVariant } from '@repo/shared-types';

const METHODS: RefundMethod[] = ['ORIGINAL_PAYMENT', 'STORE_CREDIT', 'EXCHANGE'];

type ResolveFormState = {
  method: RefundMethod;
  notes: string;
  isSubmitting: boolean;
  exchangeProductId: string;
  exchangeVariantId: string;
};

type ResolveFormAction =
  | { type: 'set_method'; value: RefundMethod }
  | { type: 'set_notes'; value: string }
  | { type: 'set_exchange_product'; productId: string }
  | { type: 'set_exchange_variant'; variantId: string }
  | { type: 'submit_start' }
  | { type: 'submit_end' };

const resolveFormInitialState: ResolveFormState = {
  method: 'ORIGINAL_PAYMENT',
  notes: '',
  isSubmitting: false,
  exchangeProductId: '',
  exchangeVariantId: '',
};

function resolveFormReducer(state: ResolveFormState, action: ResolveFormAction): ResolveFormState {
  switch (action.type) {
    case 'set_method':
      return { ...state, method: action.value };
    case 'set_notes':
      return { ...state, notes: action.value };
    case 'set_exchange_product':
      return { ...state, exchangeProductId: action.productId, exchangeVariantId: '' };
    case 'set_exchange_variant':
      return { ...state, exchangeVariantId: action.variantId };
    case 'submit_start':
      return { ...state, isSubmitting: true };
    case 'submit_end':
      return { ...state, isSubmitting: false };
    default:
      return state;
  }
}

export default function ResolveReturnPage({ returnRequest }: { returnRequest: ReturnRequest }) {
  const router = useRouter();
  const api = useApiClient();
  const authReady = useAuthApiReady();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { data: liveReturn } = useQuery({
    queryKey: ['returns', returnRequest.id],
    queryFn: () => api.returns.findOne(returnRequest.id),
    initialData: returnRequest,
    enabled: authReady,
  });
  const activeReturn = liveReturn ?? returnRequest;
  const [form, dispatch] = React.useReducer(resolveFormReducer, resolveFormInitialState);
  const { method, notes, isSubmitting, exchangeProductId, exchangeVariantId } = form;
  const [products, setProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    api.products.findAll().then((data) => setProducts(data)).catch(() => setProducts([]));
  }, [api]);

  const selectedProduct = products.find((p) => p.id === exchangeProductId);

  const total = activeReturn.items.reduce(
    (sum, item) => sum + (item.refundValue ?? 0) * item.quantity,
    0,
  );

  function handleProductChange(productId: string) {
    dispatch({ type: 'set_exchange_product', productId });
  }

  function handleVariantChange(variantId: string) {
    dispatch({ type: 'set_exchange_variant', variantId });
  }

  function getSelectedVariant(): ProductVariant | undefined {
    if (!selectedProduct?.variants) return undefined;
    if (exchangeVariantId) {
      return selectedProduct.variants.find((v) => v.id === exchangeVariantId);
    }
    return selectedProduct.variants[0];
  }

  function getExchangeSummary(): string | null {
    if (method !== 'EXCHANGE' || !selectedProduct) return null;
    const variant = getSelectedVariant();
    const totalQuantity = activeReturn.items.reduce((sum, item) => sum + item.quantity, 0);
    const label = variant ? `${selectedProduct.name} — ${variant.name}` : selectedProduct.name;
    return `${label} (Cantidad: ${totalQuantity})`;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    dispatch({ type: 'submit_start' });
    try {
      const payload: { refundMethod: RefundMethod; notes?: string; exchangeProductId?: string; exchangeVariantId?: string } = {
        refundMethod: method,
        notes,
      };
      if (method === 'EXCHANGE') {
        if (!exchangeProductId) {
          throw new Error('Selecciona un producto de reemplazo para el cambio');
        }
        payload.exchangeProductId = exchangeProductId;
        if (exchangeVariantId) payload.exchangeVariantId = exchangeVariantId;
      }
      await api.returns.resolve(activeReturn.id, payload);
      toast.success('Devolución resuelta correctamente');
      router.push(`/admin/returns/${activeReturn.id}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No se pudo resolver la devolución',
      );
    } finally {
      dispatch({ type: 'submit_end' });
    }
  }

  return (
    <AnimatedPageShell
      className="flex flex-col gap-6"
      header={
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Resolver devolución</h1>
          <Badge variant="outline">{returnStatusLabel(activeReturn.status)}</Badge>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <NeoReveal>
          <Card>
          <CardHeader>
            <CardTitle>Artículos a resolver</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {activeReturn.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.productId}</p>
                  <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                </div>
                <span className="font-semibold">
                  {formatPrice((item.refundValue ?? 0) * item.quantity)}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-4 font-semibold">
              <span>Valor total del reembolso</span>
              <span>{formatPrice(total)}</span>
            </div>
          </CardContent>
        </Card>
        </NeoReveal>

        <NeoReveal delay={0.08}>
          <Card>
          <CardHeader>
            <CardTitle>Método de resolución</CardTitle>
          </CardHeader>
          <CardContent>
            <form data-testid="resolve-return-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
              <RadioGroup
                value={method}
                onValueChange={(value) => dispatch({ type: 'set_method', value: value as RefundMethod })}
                className="flex flex-col gap-3"
              >
                {METHODS.map((m) => (
                  <Label
                    key={m}
                    htmlFor={`method-${m}`}
                    className="flex cursor-pointer items-center gap-3 border-[3px] border-neo-onyx bg-white p-3 shadow-[4px_4px_0_0_#111111] transition-colors hover:bg-neo-gold normal-case"
                  >
                    <RadioGroupItem value={m} id={`method-${m}`} />
                    <span className="font-bold">{refundMethodLabel(m)}</span>
                  </Label>
                ))}
              </RadioGroup>

              {method === 'EXCHANGE' ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="exchangeProduct">Producto de reemplazo</Label>
                    <FormSelect
                      id="exchangeProduct"
                      value={exchangeProductId}
                      onValueChange={handleProductChange}
                      placeholder="Seleccionar un producto"
                      required
                      options={products.map((product: Product) => ({
                        value: product.id,
                        label: product.name,
                      }))}
                    />
                  </div>

                  {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="exchangeVariant">Variante</Label>
                      <FormSelect
                        id="exchangeVariant"
                        value={exchangeVariantId}
                        onValueChange={handleVariantChange}
                        placeholder="Variante predeterminada"
                        options={[
                          { value: '', label: 'Variante predeterminada' },
                          ...selectedProduct.variants.map((variant: ProductVariant) => ({
                            value: variant.id,
                            label: `${variant.name} (${variant.sku})`,
                          })),
                        ]}
                      />
                    </div>
                  ) : null}

                  {getExchangeSummary() ? (
                    <p className="text-sm text-muted-foreground">{getExchangeSummary()}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => dispatch({ type: 'set_notes', value: e.target.value })}
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                disabled={
                  !mounted
                  || !authReady
                  || isSubmitting
                  || activeReturn.status !== 'INSPECTION'
                  || (method === 'EXCHANGE' && !exchangeProductId)
                }
              >
                {isSubmitting ? 'Resolviendo…' : 'Confirmar resolución'}
              </Button>
            </form>
          </CardContent>
        </Card>
        </NeoReveal>
      </div>
    </AnimatedPageShell>
  );
}
