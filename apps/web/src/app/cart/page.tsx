'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProductImage } from '@/components/store/product-image';
import { AnimatedPageShell, NeoItem, NeoStagger } from '@/components/motion/neo-page-transition';
import { useCartStore } from '@/lib/cart-store';
import { trackEvent } from '@/lib/analytics/track';
import { formatPrice } from '@repo/shared-utils';

export default function CartPage() {
  const router = useRouter();
  const { items, updateItem, removeItem } = useCartStore();

  if (items.length === 0) {
    return (
      <AnimatedPageShell className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-anton text-4xl uppercase">Carrito vacío</h1>
        <p className="mt-2 font-bold text-muted-foreground">
          Aún no has agregado productos.
        </p>
        <Link href="/store">
          <Button className="mt-6">Seguir comprando</Button>
        </Link>
      </AnimatedPageShell>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const shipping = subtotal > 50 ? 0 : 5;
  const total = subtotal + shipping;

  return (
    <AnimatedPageShell
      className="container mx-auto px-4 py-8"
      header={<h1 className="font-anton text-4xl uppercase md:text-5xl">Carrito</h1>}
    >
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <NeoStagger className="lg:col-span-2 flex flex-col gap-4">
          {items.map((item) => (
            <NeoItem key={`${item.productId}:${item.variantId ?? ''}`}>
              <Card>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <ProductImage url={item.imageUrl} alt={item.name} variant="thumbnail" />
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.price)} c/u
                  </p>
                  {item.variantId ? (
                    <p className="text-sm text-muted-foreground">
                      Variante: {item.variantId}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.productId, Number(e.target.value), item.variantId)
                    }
                    className="w-20"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void trackEvent('remove_from_cart', {
                        productId: item.productId,
                        variantId: item.variantId,
                      });
                      removeItem(item.productId, item.variantId);
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
            </NeoItem>
          ))}
        </NeoStagger>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumen del pedido</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Envío</span>
                <span>{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  void trackEvent('begin_checkout', {
                    cartTotal: total,
                    itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
                  });
                  router.push('/checkout');
                }}
              >
                Finalizar compra
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AnimatedPageShell>
  );
}
