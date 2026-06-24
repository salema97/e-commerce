'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { ProductCard } from '@/components/store/product-card';
import type { Product } from '@repo/shared-types';
import { fadeUpVariants, productCardVariants, productGridVariants, reducedMotionTransition } from '@/lib/neo-motion';

interface FeaturedProductsSectionProps {
  products: Product[];
}

export function FeaturedProductsSection({ products }: FeaturedProductsSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="container mx-auto px-4">
      <motion.div
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
      </motion.div>

      <motion.div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        variants={productGridVariants}
        initial={prefersReducedMotion ? false : 'hidden'}
        whileInView={prefersReducedMotion ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.1 }}
      >
        {products.map((product) => (
          <motion.div
            key={product.id}
            variants={productCardVariants}
            transition={prefersReducedMotion ? reducedMotionTransition : undefined}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
