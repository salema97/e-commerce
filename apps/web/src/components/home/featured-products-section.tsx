'use client';

import Link from 'next/link';
import { m, useReducedMotion } from 'motion/react';
import { ProductCard } from '@/components/store/product-card';
import type { ProductCardItem } from '@/components/store/product-card';
import { fadeUpVariants, productCardVariants, productGridVariants, reducedMotionTransition } from '@/lib/neo-motion';

interface FeaturedProductsSectionProps {
  products: ProductCardItem[];
}

export function FeaturedProductsSection({ products }: FeaturedProductsSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="container mx-auto px-4">
      <m.div
        className="mb-8 flex items-end justify-between border-b-[6px] border-neo-onyx pb-4"
        variants={fadeUpVariants}
        initial={prefersReducedMotion ? false : 'hidden'}
        whileInView={prefersReducedMotion ? undefined : 'visible'}
        viewport={{ once: true }}
        transition={prefersReducedMotion ? reducedMotionTransition : undefined}
      >
        <h2 className="font-anton text-4xl uppercase md:text-5xl">Productos destacados</h2>
        <Link href="/store" className="px-3 py-1 text-sm font-bold uppercase hover:bg-neo-gold">
          Ver todo
        </Link>
      </m.div>

      <m.div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        variants={productGridVariants}
        initial={prefersReducedMotion ? false : 'hidden'}
        whileInView={prefersReducedMotion ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.1 }}
      >
        {products.map((product) => (
          <m.div
            key={product.id}
            variants={productCardVariants}
            transition={prefersReducedMotion ? reducedMotionTransition : undefined}
          >
            <ProductCard product={product} />
          </m.div>
        ))}
      </m.div>
    </section>
  );
}
