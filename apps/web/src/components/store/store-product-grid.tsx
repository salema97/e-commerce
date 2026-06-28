'use client';

import { m, useReducedMotion } from 'motion/react';
import { ProductCard, type ProductCardItem } from '@/components/store/product-card';
import { productCardVariants, productGridVariants, reducedMotionTransition } from '@/lib/neo-motion';

interface StoreProductGridProps {
  products: ProductCardItem[];
  /** When set, re-animates the grid on filter changes instead of only on scroll into view. */
  animationKey?: string;
}

export function StoreProductGrid({ products, animationKey }: StoreProductGridProps) {
  const prefersReducedMotion = useReducedMotion();
  const gridKey = animationKey ?? products.map((product) => product.id).join(',');

  return (
    <m.div
      key={gridKey}
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      variants={productGridVariants}
      initial={prefersReducedMotion ? false : 'hidden'}
      animate={animationKey && !prefersReducedMotion ? 'visible' : undefined}
      whileInView={animationKey || prefersReducedMotion ? undefined : 'visible'}
      viewport={animationKey ? undefined : { once: true, amount: 0.05 }}
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
