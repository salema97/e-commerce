import Link from 'next/link';
import { getServerApiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { HomeHero } from '@/components/home/home-hero';
import { CategoryBentoGrid } from '@/components/home/category-bento-grid';
import { FeaturedProductsSection } from '@/components/home/featured-products-section';
import {
  getProductPrimaryImageUrl,
  getProductPrimaryImageAlt,
} from '@repo/shared-utils';
import type { Product, Category } from '@repo/shared-types';

export default async function HomePage() {
  const api = await getServerApiClient();
  let featuredProducts: Product[] = [];
  let categories: Category[] = [];

  try {
    const [productsResult, categoriesResult] = await Promise.allSettled([
      api.products.findAll({ status: 'ACTIVE' }),
      api.categories.findAll(),
    ]);
    const allProducts = productsResult.status === 'fulfilled' ? productsResult.value : [];
    featuredProducts = allProducts.filter((p) => p.isFeatured).slice(0, 6);
    if (featuredProducts.length === 0) {
      featuredProducts = allProducts.slice(0, 6);
    }
    categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value.slice(0, 6) : [];
  } catch {
    featuredProducts = [];
    categories = [];
  }

  const heroProduct = featuredProducts[0];

  return (
    <div className="flex flex-col gap-16 pb-16">
      <HomeHero
        heroProduct={heroProduct}
        imageUrl={heroProduct ? getProductPrimaryImageUrl(heroProduct) : undefined}
        imageAlt={heroProduct ? getProductPrimaryImageAlt(heroProduct) : undefined}
      />

      {categories.length > 0 ? (
        <section className="px-4 py-8 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="border-l-[12px] border-neo-gold pl-6">
                <h2 className="font-anton text-5xl uppercase leading-none tracking-tighter md:text-7xl">
                  Explora
                  <br />
                  colecciones
                </h2>
              </div>
              <Link href="/categories">
                <Button variant="secondary">Ver todas</Button>
              </Link>
            </div>

            <CategoryBentoGrid categories={categories} />
          </div>
        </section>
      ) : null}

      {featuredProducts.length > 0 ? <FeaturedProductsSection products={featuredProducts} /> : null}

      <section className="p-4 md:p-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 border-[3px] border-neo-onyx bg-neo-onyx p-10 shadow-[12px_12px_0_0_#FFD800] md:flex-row md:p-16">
          <div className="md:w-1/2">
            <h2 className="font-anton text-4xl uppercase leading-none text-neo-gold md:text-6xl">
              No te pierdas las novedades
            </h2>
            <p className="mt-4 text-lg font-bold uppercase tracking-widest text-white/80">
              Explora el catálogo completo y guarda tus favoritos.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <Link href="/store">
              <Button variant="secondary" size="lg" className="w-full min-w-[200px]">
                Ir a la tienda
              </Button>
            </Link>
            <Link href="/wishlist">
              <Button variant="outline" size="lg" className="w-full min-w-[200px] border-white bg-transparent text-white hover:bg-neo-gold hover:text-neo-onyx">
                Mi lista de deseos
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
