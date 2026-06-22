import Link from 'next/link';
import Image from 'next/image';
import { getServerApiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@repo/shared-utils';
import type { Product, Category } from '@repo/shared-types';

export default async function HomePage() {
  const api = getServerApiClient();
  let featuredProducts: Product[] = [];
  let categories: Category[] = [];

  try {
    const [productsResult, categoriesResult] = await Promise.allSettled([
      api.products.findAll({ status: 'ACTIVE' }),
      api.categories.findAll(),
    ]);
    featuredProducts = productsResult.status === 'fulfilled' ? productsResult.value.slice(0, 6) : [];
    categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value.slice(0, 4) : [];
  } catch {
    featuredProducts = [];
    categories = [];
  }

  return (
    <div className="flex flex-col gap-16 pb-16">
      <section className="relative bg-muted/50 py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Welcome to Store
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Discover quality products curated for you. Fast shipping and secure checkout.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/store">
              <Button size="lg">Shop now</Button>
            </Link>
            <Link href="/categories">
              <Button variant="outline" size="lg">Browse categories</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Featured Categories</h2>
          <Link href="/categories" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/store?category=${category.slug}`}>
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {category.description ?? 'Explore products in this category.'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Featured Products</h2>
          <Link href="/store" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0];

  return (
    <Link href={`/store/${product.slug}`}>
      <Card className="group overflow-hidden hover:border-primary/50 transition-colors">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt ?? product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{product.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          {product.compareAtPrice ? (
            <Badge variant="secondary">Sale</Badge>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
