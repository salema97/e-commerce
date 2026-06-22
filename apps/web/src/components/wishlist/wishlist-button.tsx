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
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart className={inWishlist ? 'fill-current' : ''} />
    </Button>
  );
}
