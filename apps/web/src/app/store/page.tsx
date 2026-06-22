import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getServerApiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@repo/shared-utils';
import type { Product, Category } from '@repo/shared-types';

interface StorePageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function StorePage({ searchParams }: StorePageProps) {
  const params = await searchParams;
  const api = getServerApiClient();

  const categorySlug = params.category;
  const search = params.search;
  const sort = params.sort ?? 'newest';
  const page = Math.max(1, Number(params.page ?? '1'));
  const limit = 12;

  const [productsResult, categoriesResult] = await Promise.allSettled([
    api.products.findAll({ status: 'ACTIVE' }),
    api.categories.findAll(),
  ]);

  let products: Product[] = productsResult.status === 'fulfilled' ? productsResult.value : [];
  const categories: Category[] = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];

  if (categorySlug) {
    const category = categories.find((c) => c.slug === categorySlug);
    if (category) {
      products = products.filter((p) => p.categoryId === category.id);
    }
  }

  if (search) {
    const q = search.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q),
    );
  }

  products = sortProducts(products, sort);

  const total = products.length;
  const start = (page - 1) * limit;
  const paginatedProducts = products.slice(start, start + limit);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Shop</h1>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row">
        <aside className="w-full lg:w-64">
          <form className="flex flex-col gap-4" action="/store" method="GET">
            <div className="flex flex-col gap-2">
              <label htmlFor="search" className="text-sm font-medium">Search</label>
              <Input
                id="search"
                name="search"
                defaultValue={search}
                placeholder="Search products..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="category" className="text-sm font-medium">Category</label>
              <Select id="category" name="category" defaultValue={categorySlug ?? ''}>
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="sort" className="text-sm font-medium">Sort by</label>
              <Select id="sort" name="sort" defaultValue={sort}>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to high</option>
                <option value="price_desc">Price: High to low</option>
                <option value="name_asc">Name: A-Z</option>
              </Select>
            </div>

            <Button type="submit" className="w-full">Apply filters</Button>
          </form>
        </aside>

        <div className="flex-1">
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {paginatedProducts.length} of {total} products
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {paginatedProducts.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              No products found.
            </div>
          ) : null}

          <Separator className="my-8" />

          <div className="flex items-center justify-between">
            <Link
              href={buildHref({ ...params, page: String(page - 1) })}
              aria-disabled={page <= 1}
            >
              <Button variant="outline" disabled={page <= 1}>Previous</Button>
            </Link>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Link
              href={buildHref({ ...params, page: String(page + 1) })}
              aria-disabled={page >= totalPages}
            >
              <Button variant="outline" disabled={page >= totalPages}>Next</Button>
            </Link>
          </div>
        </div>
      </div>
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

function sortProducts(products: Product[], sort: string): Product[] {
  const copy = [...products];
  switch (sort) {
    case 'price_asc':
      return copy.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return copy.sort((a, b) => b.price - a.price);
    case 'name_asc':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'newest':
    default:
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

function buildHref(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }
  const query = searchParams.toString();
  return query ? `/store?${query}` : '/store';
}
