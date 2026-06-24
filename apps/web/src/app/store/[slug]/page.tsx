import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AddToCartButton } from '@/components/cart/add-to-cart-button';
import { WishlistButton } from '@/components/wishlist/wishlist-button';
import { BackInStockForm } from '@/components/product/back-in-stock-form';
import { ProductReviews } from '@/components/product/product-reviews';
import { ProductViewTracker } from '@/components/analytics/product-view-tracker';
import { formatPrice } from '@repo/shared-utils';
import { getProductAvailableQuantity } from '@/lib/product-stock';
import type { Product } from '@repo/shared-types';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const api = getServerApiClient();
  try {
    const product = await api.products.findBySlug(slug);
    return {
      title: product.name,
      description: product.description ?? `Buy ${product.name}`,
    };
  } catch {
    return { title: 'Product not found' };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const api = getServerApiClient();

  let product: Product;
  try {
    product = await api.products.findBySlug(slug);
  } catch {
    notFound();
  }

  const image = product.images?.[0];
  const variants = product.variants ?? [];
  const availableQuantity = getProductAvailableQuantity(product.inventory);
  const isOutOfStock = availableQuantity <= 0;
  const isPreOrder =
    product.isPreOrder &&
    product.preOrderReleaseDate &&
    new Date(product.preOrderReleaseDate) > new Date();

  let reviewSummary = { averageRating: 0, reviewCount: 0 };
  try {
    reviewSummary = await api.reviews.summary(product.id);
  } catch {
    // Reviews may be unavailable before migration.
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: product.images?.map((img) => img.url),
    sku: product.sku ?? undefined,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: isOutOfStock && !isPreOrder
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    },
    ...(reviewSummary.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: reviewSummary.averageRating,
            reviewCount: reviewSummary.reviewCount,
          },
        }
      : {}),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductViewTracker productId={product.id} productName={product.name} />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt ?? product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {product.isFeatured ? <Badge>Featured</Badge> : null}
            {product.compareAtPrice ? <Badge variant="secondary">Sale</Badge> : null}
            {isPreOrder ? <Badge variant="outline">Pre-orden</Badge> : null}
          </div>

          <h1 className="text-3xl font-bold">{product.name}</h1>

          {reviewSummary.reviewCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {reviewSummary.averageRating.toFixed(1)} ★ ({reviewSummary.reviewCount} reseñas)
            </p>
          ) : null}

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold">{formatPrice(product.price)}</span>
            {product.compareAtPrice ? (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            ) : null}
          </div>

          <p className="text-muted-foreground">
            {product.description ?? 'No description available.'}
          </p>

          {isPreOrder && product.preOrderReleaseDate ? (
            <p className="text-sm text-muted-foreground">
              Disponible a partir del{' '}
              {new Date(product.preOrderReleaseDate).toLocaleDateString('es-EC')}
              {product.preOrderChargeTiming === 'AT_SHIPPING'
                ? ' · Cobro al enviar'
                : ' · Cobro al confirmar'}
            </p>
          ) : null}

          <AddToCartButton product={product} disabled={isOutOfStock && !isPreOrder} />
          {isOutOfStock ? <BackInStockForm productId={product.id} /> : null}
          <WishlistButton productId={product.id} name={product.name} slug={product.slug} />
        </div>
      </div>

      <Separator className="my-10" />

      {variants.length > 0 ? (
        <section>
          <h2 className="text-xl font-semibold mb-4">Variants</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {variants.map((variant) => (
              <Card key={variant.id}>
                <CardContent className="p-4">
                  <p className="font-medium">{variant.name}</p>
                  <p className="text-sm text-muted-foreground">SKU: {variant.sku}</p>
                  {variant.price ? (
                    <p className="mt-2 font-semibold">{formatPrice(variant.price)}</p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <Separator className="my-10" />
      <ProductReviews productId={product.id} />
    </div>
  );
}
