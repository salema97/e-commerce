import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@repo/shared-utils';
import type { Product } from '@repo/shared-types';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
  size?: 'default' | 'compact';
}

export function ProductCard({ product, className, size = 'default' }: ProductCardProps) {
  const image = product.images?.[0];

  return (
    <Link href={`/store/${product.slug}`} className={cn('group block', className)}>
      <Card className="overflow-hidden transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:shadow-[10px_10px_0_0_#111111]">
        <div className="relative aspect-square overflow-hidden border-b-[3px] border-neo-onyx bg-muted">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt ?? product.name}
              fill
              className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-bold uppercase text-muted-foreground">
              Sin imagen
            </div>
          )}
          {product.compareAtPrice ? (
            <div className="absolute top-3 right-3 rotate-3">
              <Badge variant="destructive">Oferta</Badge>
            </div>
          ) : null}
        </div>
        <CardHeader className={cn('pb-2', size === 'compact' && 'p-4')}>
          <CardTitle className={cn(size === 'compact' && 'text-base')}>{product.name}</CardTitle>
        </CardHeader>
        <CardContent className={cn('flex items-center justify-between', size === 'compact' && 'p-4 pt-0')}>
          <span className="font-anton text-2xl">{formatPrice(product.price)}</span>
          {product.isFeatured ? <Badge variant="secondary">Destacado</Badge> : null}
        </CardContent>
      </Card>
    </Link>
  );
}
