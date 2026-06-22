'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWishlistStore } from '@/lib/wishlist-store';

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="container mx-auto px-4 py-8">Loading wishlist...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Your wishlist is empty</h1>
        <Link href="/store">
          <Button className="mt-6">Explore products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Wishlist</h1>
      <div className="mt-8 grid gap-4">
        {items.map((item) => (
          <Card key={item.productId}>
            <CardContent className="flex items-center justify-between p-4">
              <Link href={`/store/${item.slug}`} className="font-medium hover:underline">
                {item.name}
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeItem(item.productId)}
              >
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
