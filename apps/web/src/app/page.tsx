import Link from 'next/link';
import { browseCatalog, listCategories } from '@/lib/public-catalog';
import { Button } from '@/components/ui/button';
import { HomeHero } from '@/components/home/home-hero';
import { CategoryBentoGrid } from '@/components/home/category-bento-grid';
import { FeaturedProductsSection } from '@/components/home/featured-products-section';
import { PromoBannerSlot } from '@/components/marketing/promo-banner-slot';
import {
  getProductPrimaryImageUrl,
  getProductPrimaryImageAlt,
} from '@repo/shared-utils';
import type { ProductCardItem } from '@/components/store/product-card';
import type { Category } from '@repo/shared-types';

export default async function HomePage() {
  let featuredProducts: ProductCardItem[] = [];
  let categories: Category[] = [];

  try {
    const [catalogResult, categoriesResult] = await Promise.allSettled([
      browseCatalog({ limit: 48, page: 1, sort: 'newest' }),
      listCategories(),
    ]);
    const allProducts =
      catalogResult.status === 'fulfilled' ? catalogResult.value.items : [];
    featuredProducts = allProducts.filter((p) => p.isFeatured).slice(0, 6);
    if (featuredProducts.length === 0) {
      featuredProducts = allProducts.slice(0, 6);
    }
    categories =
      categoriesResult.status === 'fulfilled' ? categoriesResult.value.slice(0, 6) : [];
  } catch {
    featuredProducts = [];
    categories = [];
  }

  const heroProduct = featuredProducts[0];

  return (
    <div className="flex flex-col gap-16 pb-16">
      <PromoBannerSlot slot="HOME_HERO" className="px-4 pt-4 md:px-8" />
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

      <PromoBannerSlot slot="STORE_TOP" variant="strip" className="px-4 md:px-8" />
    </div>
  );
}
