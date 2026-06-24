import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductImage } from '@/components/store/product-image';
import { formatPrice, getProductPrimaryImageAlt, getProductPrimaryImageUrl } from '@repo/shared-utils';
import type { Product } from '@repo/shared-types';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
  size?: 'default' | 'compact';
}

export function ProductCard({ product, className, size = 'default' }: ProductCardProps) {
  const imageUrl = getProductPrimaryImageUrl(product);

  return (
    <Link href={`/store/${product.slug}`} className={cn('group block', className)}>
      <Card className="overflow-hidden transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:shadow-[10px_10px_0_0_#111111]">
        <div className="relative">
          <ProductImage
            url={imageUrl}
            alt={getProductPrimaryImageAlt(product)}
            variant="card"
            sizes="(max-width: 768px) 100vw, 33vw"
            grayscaleHover
          />
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
