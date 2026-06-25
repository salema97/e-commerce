import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductImage } from '@/components/store/product-image';
import {
  formatPrice,
  getProductPrimaryImageAlt,
  getProductPrimaryImageUrl,
} from '@repo/shared-utils';
import type { CatalogProductSummary, Product } from '@repo/shared-types';
import { cn } from '@/lib/utils';

export type ProductCardItem = Product | CatalogProductSummary;

interface ProductCardProps {
  product: ProductCardItem;
  className?: string;
  size?: 'default' | 'compact';
}

function isCatalogSummary(product: ProductCardItem): product is CatalogProductSummary {
  return 'imageUrl' in product && !('images' in product);
}

function resolveImage(product: ProductCardItem) {
  if (isCatalogSummary(product)) {
    return {
      url: product.imageUrl ?? undefined,
      alt: product.name,
    };
  }
  return {
    url: getProductPrimaryImageUrl(product),
    alt: getProductPrimaryImageAlt(product),
  };
}

export function ProductCard({ product, className, size = 'default' }: ProductCardProps) {
  const { url: imageUrl, alt } = resolveImage(product);
  const isFeatured = isCatalogSummary(product) ? product.isFeatured : product.isFeatured;
  const compareAtPrice = product.compareAtPrice;
  const outOfStock = isCatalogSummary(product) ? !product.inStock : false;
  const reviewCount = isCatalogSummary(product) ? product.reviewCount : undefined;
  const averageRating = isCatalogSummary(product) ? product.averageRating : undefined;

  return (
    <Link href={`/store/${product.slug}`} className={cn('group block', className)}>
      <Card className="overflow-hidden transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:shadow-[10px_10px_0_0_#111111]">
        <div className="relative">
          <ProductImage
            url={imageUrl}
            alt={alt}
            variant="card"
            sizes="(max-width: 768px) 100vw, 33vw"
            grayscaleHover
          />
          {compareAtPrice ? (
            <div className="absolute top-3 right-3 rotate-3">
              <Badge variant="destructive">Oferta</Badge>
            </div>
          ) : null}
        </div>
        <CardHeader className={cn('pb-2', size === 'compact' && 'p-4')}>
          <CardTitle className={cn(size === 'compact' && 'text-base')}>{product.name}</CardTitle>
          {reviewCount && reviewCount > 0 ? (
            <p className="text-xs font-bold text-muted-foreground">
              {(averageRating ?? 0).toFixed(1)} ★ ({reviewCount})
            </p>
          ) : null}
        </CardHeader>
        <CardContent
          className={cn('flex items-center justify-between', size === 'compact' && 'p-4 pt-0')}
        >
          <span className="font-anton text-2xl">{formatPrice(product.price)}</span>
          <div className="flex gap-2">
            {outOfStock ? <Badge variant="outline">Agotado</Badge> : null}
            {isFeatured ? <Badge variant="secondary">Destacado</Badge> : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
