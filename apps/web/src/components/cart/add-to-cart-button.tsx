'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useCartStore } from '@/lib/cart-store';
import type { Product } from '@repo/shared-types';

export function AddToCartButton({
  product,
  disabled = false,
}: {
  product: Product;
  disabled?: boolean;
}) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = React.useState(1);
  const [variantId, setVariantId] = React.useState(product.variants?.[0]?.id ?? '');

  const handleAdd = () => {
    addItem({
      productId: product.id,
      variantId: variantId || undefined,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.images?.[0]?.url,
      quantity,
    });
    router.push('/cart');
  };

  return (
    <div className="flex flex-col gap-4">
      {product.variants && product.variants.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="variant">Variant</Label>
          <Select
            id="variant"
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
          >
            {product.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className="w-24"
        />
      </div>

      <Button onClick={handleAdd} className="w-full sm:w-auto" disabled={disabled}>
        {disabled ? 'Sin stock' : 'Add to cart'}
      </Button>
    </div>
  );
}
