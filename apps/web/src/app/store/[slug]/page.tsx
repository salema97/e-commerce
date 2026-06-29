import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import {
  findProductBySlug,
  fetchProductReviews,
} from '@/lib/public-catalog';
import { getSiteUrl } from '@/lib/site-url';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProductImage } from '@/components/store/product-image';
import { AddToCartButton } from '@/components/cart/add-to-cart-button';
import { ProductViewTracker } from '@/components/analytics/product-view-tracker';
import { WishlistButton } from '@/components/wishlist/wishlist-button';
import { BackInStockForm } from '@/components/product/back-in-stock-form';
import { ProductReviews } from '@/components/product/product-reviews';
import { AnimatedPageShell, NeoReveal } from '@/components/motion/neo-page-transition';
import {
  formatPrice,
  getProductPrimaryImageAlt,
  getProductPrimaryImageUrl,
  serializeJsonLd,
} from '@repo/shared-utils';
import { getProductAvailableQuantity } from '@repo/shared-utils';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProductBySlug(slug);

  if (!product) {
    return { title: 'Producto no encontrado' };
  }

  return {
    title: product.name,
    description: product.description ?? `Comprar ${product.name}`,
    alternates: {
      canonical: `${getSiteUrl()}/store/${slug}`,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await findProductBySlug(slug);
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  if (!product) {
    notFound();
  }

  const imageUrl = getProductPrimaryImageUrl(product);
  const variants = product.variants ?? [];
  const availableQuantity = getProductAvailableQuantity(product.inventory);
  const isOutOfStock = availableQuantity <= 0;
  const isPreOrder =
    product.isPreOrder &&
    product.preOrderReleaseDate &&
    new Date(product.preOrderReleaseDate) > new Date();

  const { reviews: initialReviews, summary: reviewSummary } =
    await fetchProductReviews(product.id);

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
      availability:
        isOutOfStock && !isPreOrder
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
    <AnimatedPageShell
      className="container mx-auto px-4 py-8"
      header={
        <header className="mb-6 border-b-[6px] border-neo-onyx pb-4">
          <Link
            href="/store"
            className="text-sm font-bold uppercase underline-offset-4 hover:underline"
          >
            ← Volver a la tienda
          </Link>
        </header>
      }
    >
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ProductViewTracker productId={product.id} productName={product.name} />
      <NeoReveal>
        <div className="grid gap-8 border-[3px] border-neo-onyx bg-white shadow-[10px_10px_0_0_#111111] lg:grid-cols-12">
          <div className="relative lg:col-span-7">
            <ProductImage
              url={imageUrl}
              alt={getProductPrimaryImageAlt(product)}
              variant="detail"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            <div className="absolute top-4 right-4 rotate-[-2deg] border-[3px] border-neo-onyx bg-neo-scarlet px-4 py-2 font-anton text-2xl text-white shadow-[4px_4px_0_#111]">
              {formatPrice(product.price)}
            </div>
          </div>

          <div className="flex flex-col gap-6 p-6 lg:col-span-5 lg:p-10">
            <div className="flex flex-wrap gap-2">
              {product.isFeatured ? <Badge variant="secondary">Destacado</Badge> : null}
              {product.compareAtPrice ? <Badge variant="destructive">Oferta</Badge> : null}
              {isPreOrder ? <Badge variant="outline">Pre-orden</Badge> : null}
              <Badge variant="outline">
                {isOutOfStock && !isPreOrder ? 'Sin stock' : 'En stock'}
              </Badge>
            </div>

            <h1 className="font-anton text-4xl uppercase leading-[0.9] md:text-5xl">{product.name}</h1>

            {reviewSummary.reviewCount > 0 ? (
              <p className="text-sm font-bold text-muted-foreground">
                {reviewSummary.averageRating.toFixed(1)} ★ ({reviewSummary.reviewCount} reseñas)
              </p>
            ) : null}

            <div className="flex items-end gap-3 border-b-4 border-neo-onyx pb-4">
              <span className="font-anton text-5xl">{formatPrice(product.price)}</span>
              {product.compareAtPrice ? (
                <span className="text-lg font-bold text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              ) : null}
            </div>

            {product.description ? (
              <p className="text-base font-bold leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            ) : null}

            {isPreOrder && product.preOrderReleaseDate ? (
              <p className="text-sm font-bold text-muted-foreground">
                Disponible a partir del{' '}
                {new Date(product.preOrderReleaseDate).toLocaleDateString('es-EC')}
                {product.preOrderChargeTiming === 'AT_SHIPPING'
                  ? ' · Cobro al enviar'
                  : ' · Cobro al confirmar'}
              </p>
            ) : null}

            {variants.length > 0 ? (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Variantes
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <Badge key={variant.id} variant="outline">
                      {variant.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <Separator className="border-neo-onyx" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex-1">
                <AddToCartButton product={product} disabled={isOutOfStock && !isPreOrder} />
              </div>
              <WishlistButton
                productId={product.id}
                name={product.name}
                slug={product.slug}
                imageUrl={getProductPrimaryImageUrl(product)}
              />
            </div>

            {isOutOfStock && !isPreOrder ? <BackInStockForm productId={product.id} /> : null}
          </div>
        </div>
      </NeoReveal>

      <Separator className="my-10 border-neo-onyx" />
      <ProductReviews
        productId={product.id}
        initialReviews={initialReviews}
        initialSummary={reviewSummary}
      />
    </AnimatedPageShell>
  );
}
