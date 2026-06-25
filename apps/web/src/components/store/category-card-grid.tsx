'use client';

import Link from 'next/link';
import { m, useReducedMotion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Category } from '@repo/shared-types';
import { productCardVariants, productGridVariants, reducedMotionTransition } from '@/lib/neo-motion';

interface CategoryCardGridProps {
  categories: Category[];
}

export function CategoryCardGrid({ categories }: CategoryCardGridProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      variants={productGridVariants}
      initial={prefersReducedMotion ? false : 'hidden'}
      whileInView={prefersReducedMotion ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.05 }}
    >
      {categories.map((category) => (
        <m.div
          key={category.id}
          variants={productCardVariants}
          transition={prefersReducedMotion ? reducedMotionTransition : undefined}
        >
          <Link href={`/store?category=${category.slug}`}>
            <Card className="transition-transform hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#111111]">
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  {category.description ?? 'Explorar productos de esta categoría.'}
                </p>
              </CardContent>
            </Card>
          </Link>
        </m.div>
      ))}
    </m.div>
  );
}
