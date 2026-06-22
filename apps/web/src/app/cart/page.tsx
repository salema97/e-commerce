'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@repo/shared-utils';

export default function CartPage() {
  const router = useRouter();
  const { items, updateItem, removeItem } = useCartStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <CartSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Looks like you have not added anything yet.
        </p>
        <Link href="/store">
          <Button className="mt-6">Continue shopping</Button>
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const shipping = subtotal > 50 ? 0 : 5;
  const total = subtotal + shipping;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Shopping Cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {items.map((item) => (
            <Card key={`${item.productId}:${item.variantId ?? ''}`}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.price)} each
                  </p>
                  {item.variantId ? (
                    <p className="text-sm text-muted-foreground">
                      Variant: {item.variantId}
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
                    onClick={() => removeItem(item.productId, item.variantId)}
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Button className="w-full" onClick={() => router.push('/checkout')}>
                Proceed to checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
