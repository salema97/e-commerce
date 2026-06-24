import Link from 'next/link';
import { getServerApiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/store/product-card';
import { ProductImage } from '@/components/store/product-image';
import {
  formatPrice,
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
      <section className="p-4 md:p-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 border-[3px] border-neo-onyx bg-neo-gold shadow-[10px_10px_0_0_#111111] md:grid-cols-12">
          <div className="flex items-center justify-center border-b-[3px] border-neo-onyx bg-white py-10 md:col-span-1 md:border-b-0 md:border-r-[3px]">
            <h2 className="font-anton text-3xl uppercase tracking-tighter md:text-5xl md:[writing-mode:vertical-rl] md:rotate-180">
              Colección destacada
            </h2>
          </div>

          <div className="relative flex flex-col justify-center bg-neo-gold p-6 md:col-span-7 md:p-12">
            <div className="relative">
              {heroProduct && getProductPrimaryImageUrl(heroProduct) ? (
                <div className="absolute -inset-2 -rotate-1 border-[3px] border-neo-onyx bg-neo-scarlet md:-inset-4" />
              ) : null}
              <ProductImage
                variant="hero"
                url={heroProduct ? getProductPrimaryImageUrl(heroProduct) : undefined}
                alt={heroProduct ? getProductPrimaryImageAlt(heroProduct) : undefined}
                fallbackLabel="Catálogo en vivo"
                fill={false}
                width={800}
                height={1000}
                priority
                imageClassName="aspect-[4/5] w-full"
                className="relative"
              />
            </div>
          </div>

          <div className="flex flex-col justify-between border-t-[3px] border-neo-onyx bg-white p-8 md:col-span-4 md:border-t-0 md:border-l-[3px] md:p-10">
            <div>
              <div className="mb-6 flex flex-wrap gap-2">
                <Badge>Novedad</Badge>
                {heroProduct?.isFeatured ? <Badge variant="secondary">Destacado</Badge> : null}
              </div>
              <h1 className="font-anton text-5xl uppercase leading-[0.85] md:text-7xl">
                {heroProduct?.name ?? 'Bienvenido a NEO.STORE'}
              </h1>
              <p className="mt-6 text-lg font-bold leading-tight">
                {heroProduct?.description ??
                  'Descubre productos seleccionados. Envío rápido y pago seguro.'}
              </p>
            </div>

            <div className="mt-10 space-y-6">
              {heroProduct ? (
                <div className="flex items-end justify-between border-b-4 border-neo-onyx pb-4">
                  <div>
                    <span className="text-sm font-bold uppercase opacity-50">Precio</span>
                    <p className="font-anton text-5xl">{formatPrice(heroProduct.price)}</p>
                  </div>
                </div>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href={heroProduct ? `/store/${heroProduct.slug}` : '/store'} className="flex-1">
                  <Button size="lg" className="w-full font-anton text-2xl">
                    {heroProduct ? 'Ver producto' : 'Ir a tienda'}
                  </Button>
                </Link>
                <Link href="/categories" className="flex-1">
                  <Button variant="outline" size="lg" className="w-full">
                    Categorías
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

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

            <div className="grid-tetris">
              {categories.map((category, index) => (
                <CategoryBentoCard key={category.id} category={category} index={index} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {featuredProducts.length > 0 ? (
        <section className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between border-b-[6px] border-neo-onyx pb-4">
            <h2 className="font-anton text-4xl uppercase md:text-5xl">Productos destacados</h2>
            <Link href="/store" className="text-sm font-bold uppercase hover:bg-neo-gold px-3 py-1">
              Ver todo
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

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

function CategoryBentoCard({ category, index }: { category: Category; index: number }) {
  const layouts = [
    'col-span-4 row-span-2 min-h-[280px]',
    'col-span-2 row-span-2 min-h-[280px] bg-neo-scarlet',
    'col-span-3 row-span-1 min-h-[160px] bg-neo-gold',
    'col-span-1 row-span-1 min-h-[160px]',
    'col-span-2 row-span-1 min-h-[160px] bg-neo-onyx text-neo-gold',
    'col-span-3 row-span-1 min-h-[160px]',
  ];
  const layout = layouts[index % layouts.length];

  return (
    <Link
      href={`/store?category=${category.slug}`}
      className={`group relative flex flex-col justify-end overflow-hidden border-[3px] border-neo-onyx bg-white p-6 shadow-[6px_6px_0_0_#111111] transition-transform hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#111111] ${layout}`}
    >
      <h3 className="font-anton text-3xl uppercase leading-none md:text-4xl">{category.name}</h3>
      {category.description ? (
        <p className="mt-2 text-sm font-bold uppercase tracking-wide opacity-80 line-clamp-2">
          {category.description}
        </p>
      ) : null}
      <span className="mt-4 inline-block w-fit border-[2px] border-current bg-neo-onyx px-3 py-1 text-xs font-bold uppercase text-white group-hover:bg-neo-scarlet">
        Explorar
      </span>
    </Link>
  );
}
