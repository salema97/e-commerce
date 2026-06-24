'use client';

import { m, useReducedMotion } from 'motion/react';
import { ProductCard } from '@/components/store/product-card';
import type { Product } from '@repo/shared-types';
import { productCardVariants, productGridVariants, reducedMotionTransition } from '@/lib/neo-motion';

interface StoreProductGridProps {
  products: Product[];
}

export function StoreProductGrid({ products }: StoreProductGridProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      variants={productGridVariants}
      initial={prefersReducedMotion ? false : 'hidden'}
      whileInView={prefersReducedMotion ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.05 }}
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
  );
}
