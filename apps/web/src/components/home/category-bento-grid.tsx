'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import type { Category } from '@repo/shared-types';
import {
  bentoContainerVariants,
  bentoHover,
  bentoItemVariants,
  reducedMotionTransition,
} from '@/lib/neo-motion';

const layouts = [
  'col-span-4 row-span-2 min-h-[280px] bg-white',
  'col-span-2 row-span-2 min-h-[280px] bg-neo-scarlet',
  'col-span-3 row-span-1 min-h-[160px] bg-neo-gold',
  'col-span-1 row-span-1 min-h-[160px] bg-white',
  'col-span-2 row-span-1 min-h-[160px] bg-neo-onyx text-neo-gold',
  'col-span-3 row-span-1 min-h-[160px] bg-white',
];

interface CategoryBentoGridProps {
  categories: Category[];
}

export function CategoryBentoGrid({ categories }: CategoryBentoGridProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="grid-tetris"
      variants={bentoContainerVariants}
      initial={prefersReducedMotion ? false : 'hidden'}
      whileInView={prefersReducedMotion ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.2 }}
    >
      {categories.map((category, index) => {
        const layout = layouts[index % layouts.length];

        return (
          <motion.div
            key={category.id}
            variants={bentoItemVariants}
            transition={prefersReducedMotion ? reducedMotionTransition : undefined}
            whileHover={prefersReducedMotion ? undefined : bentoHover}
            className={`shadow-[6px_6px_0_0_#111111] ${layout}`}
          >
            <Link
              href={`/store?category=${category.slug}`}
              className="group relative flex h-full min-h-[inherit] flex-col justify-end overflow-hidden border-[3px] border-neo-onyx bg-inherit p-6"
            >
              <h3 className="font-anton text-3xl uppercase leading-none md:text-4xl">{category.name}</h3>
              {category.description ? (
                <p className="mt-2 line-clamp-2 text-sm font-bold uppercase tracking-wide opacity-80">
                  {category.description}
                </p>
              ) : null}
              <span className="mt-4 inline-block w-fit border-[2px] border-current bg-neo-onyx px-3 py-1 text-xs font-bold uppercase text-white group-hover:bg-neo-scarlet">
                Explorar
              </span>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
