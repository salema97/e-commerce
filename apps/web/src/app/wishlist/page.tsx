'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProductImage } from '@/components/store/product-image';
import { AnimatedPageShell, NeoItem, NeoStagger } from '@/components/motion/neo-page-transition';
import { useWishlistStore } from '@/lib/wishlist-store';

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();

  if (items.length === 0) {
    return (
      <AnimatedPageShell className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Tu lista de deseos está vacía</h1>
        <Link href="/store">
          <Button className="mt-6">Explorar productos</Button>
        </Link>
      </AnimatedPageShell>
    );
  }

  return (
    <AnimatedPageShell
      className="container mx-auto px-4 py-8"
      header={<h1 className="text-3xl font-bold">Lista de deseos</h1>}
    >
      <NeoStagger className="mt-8 grid gap-4">
        {items.map((item) => (
          <NeoItem key={item.productId}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <ProductImage url={item.imageUrl} alt={item.name} variant="thumbnail" />
                <Link href={`/store/${item.slug}`} className="flex-1 font-medium hover:underline">
                  {item.name}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(item.productId)}
                >
                  Eliminar
                </Button>
              </CardContent>
            </Card>
          </NeoItem>
        ))}
      </NeoStagger>
    </AnimatedPageShell>
  );
}
