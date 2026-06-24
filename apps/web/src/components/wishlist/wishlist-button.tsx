'use client';

import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlistStore } from '@/lib/wishlist-store';

interface WishlistButtonProps {
  productId: string;
  name: string;
  slug: string;
}

export function WishlistButton({ productId, name, slug }: WishlistButtonProps) {
  const { addItem, removeItem, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(productId);

  return (
    <Button
      variant={inWishlist ? 'default' : 'outline'}
      size="icon"
      onClick={() => {
        if (inWishlist) {
          removeItem(productId);
        } else {
          addItem({ productId, name, slug });
        }
      }}
      aria-label={inWishlist ? 'Eliminar de la lista de deseos' : 'Agregar a la lista de deseos'}
    >
      <Heart className={inWishlist ? 'fill-current' : ''} />
    </Button>
  );
}
