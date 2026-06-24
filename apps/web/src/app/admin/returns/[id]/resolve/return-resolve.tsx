'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApiClient, useAuthApiReady } from '@/lib/client-api';
import {
  formatPrice,
  returnStatusLabel,
  refundMethodLabel,
} from '@repo/shared-utils';
import type { ReturnRequest, RefundMethod, Product, ProductVariant } from '@repo/shared-types';

const METHODS: RefundMethod[] = ['ORIGINAL_PAYMENT', 'STORE_CREDIT', 'EXCHANGE'];

export default function ResolveReturnPage({ returnRequest }: { returnRequest: ReturnRequest }) {
  const router = useRouter();
  const api = useApiClient();
  const authReady = useAuthApiReady();
  const [method, setMethod] = React.useState<RefundMethod>('ORIGINAL_PAYMENT');
  const [notes, setNotes] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [exchangeProductId, setExchangeProductId] = React.useState('');
  const [exchangeVariantId, setExchangeVariantId] = React.useState('');
  const [products, setProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    api.products.findAll().then((data) => setProducts(data)).catch(() => setProducts([]));
  }, [api]);

  const selectedProduct = products.find((p) => p.id === exchangeProductId);

  const total = returnRequest.items.reduce(
    (sum, item) => sum + (item.refundValue ?? 0) * item.quantity,
    0,
  );

  function handleProductChange(productId: string) {
    setExchangeProductId(productId);
    setExchangeVariantId('');
  }

  function handleVariantChange(variantId: string) {
    setExchangeVariantId(variantId);
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
    const totalQuantity = returnRequest.items.reduce((sum, item) => sum + item.quantity, 0);
    const label = variant ? `${selectedProduct.name} — ${variant.name}` : selectedProduct.name;
    return `${label} (Cantidad: ${totalQuantity})`;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
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
      await api.returns.resolve(returnRequest.id, payload);
      router.push(`/admin/returns/${returnRequest.id}`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Resolver devolución</h1>
        <Badge variant="outline">{returnStatusLabel(returnRequest.status)}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Artículos a resolver</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {returnRequest.items.map((item) => (
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

        <Card>
          <CardHeader>
            <CardTitle>Método de resolución</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                {METHODS.map((m) => (
                  <label
                    key={m}
                    className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-muted/50"
                  >
                    <input
                      type="radio"
                      name="refundMethod"
                      value={m}
                      checked={method === m}
                      onChange={() => setMethod(m)}
                    />
                    <span className="font-medium">{refundMethodLabel(m)}</span>
                  </label>
                ))}
              </div>

              {method === 'EXCHANGE' ? (
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <label htmlFor="exchangeProduct" className="text-sm font-medium">Producto de reemplazo</label>
                    <select
                      id="exchangeProduct"
                      value={exchangeProductId}
                      onChange={(e) => handleProductChange(e.target.value)}
                      className="rounded-md border px-3 py-2 text-sm"
                      required
                    >
                      <option value="" disabled>Seleccionar un producto</option>
                      {products?.map((product: Product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                    <div className="grid gap-2">
                      <label htmlFor="exchangeVariant" className="text-sm font-medium">Variante</label>
                      <select
                        id="exchangeVariant"
                        value={exchangeVariantId}
                        onChange={(e) => handleVariantChange(e.target.value)}
                        className="rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="">Variante predeterminada</option>
                        {selectedProduct.variants.map((variant: ProductVariant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.name} ({variant.sku})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  {getExchangeSummary() ? (
                    <p className="text-sm text-muted-foreground">{getExchangeSummary()}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-2">
                <label htmlFor="notes" className="text-sm font-medium">Notas</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-md border px-3 py-2 text-sm"
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={isSubmitting || !authReady || returnRequest.status !== 'INSPECTION' || (method === 'EXCHANGE' && !exchangeProductId)}>
                {isSubmitting ? 'Resolviendo…' : 'Confirmar resolución'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
