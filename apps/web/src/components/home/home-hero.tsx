'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductImage } from '@/components/store/product-image';
import { formatPrice } from '@repo/shared-utils';
import type { Product } from '@repo/shared-types';
import {
  heroCol1Variants,
  heroCol2Variants,
  heroCol3Variants,
  reducedMotionTransition,
} from '@/lib/neo-motion';

interface HomeHeroProps {
  heroProduct?: Product;
  imageUrl?: string;
  imageAlt?: string;
}

export function HomeHero({ heroProduct, imageUrl, imageAlt }: HomeHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const motionProps = prefersReducedMotion
    ? { initial: false as const }
    : { initial: 'hidden' as const, animate: 'visible' as const };

  return (
    <section className="p-4 md:p-8">
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 border-[3px] border-neo-onyx bg-neo-gold shadow-[10px_10px_0_0_#111111] md:grid-cols-12">
        <motion.div
          className="flex items-center justify-center border-b-[3px] border-neo-onyx bg-white py-10 md:col-span-1 md:border-b-0 md:border-r-[3px]"
          variants={heroCol1Variants}
          transition={prefersReducedMotion ? reducedMotionTransition : undefined}
          {...motionProps}
        >
          <h2 className="font-anton text-3xl uppercase tracking-tighter md:text-5xl md:[writing-mode:vertical-rl] md:rotate-180">
            Colección destacada
          </h2>
        </motion.div>

        <motion.div
          className="relative flex flex-col justify-center bg-neo-gold p-6 md:col-span-7 md:p-12"
          variants={heroCol2Variants}
          transition={prefersReducedMotion ? reducedMotionTransition : undefined}
          {...motionProps}
        >
          <div className="relative">
            {heroProduct && imageUrl ? (
              <div className="absolute -inset-2 -rotate-1 border-[3px] border-neo-onyx bg-neo-scarlet md:-inset-4" />
            ) : null}
            <ProductImage
              variant="hero"
              url={imageUrl}
              alt={imageAlt}
              fallbackLabel="Catálogo en vivo"
              fill={false}
              width={800}
              height={1000}
              priority
              imageClassName="aspect-[4/5] w-full"
              className="relative"
            />
          </div>
        </motion.div>

        <motion.div
          className="flex flex-col justify-between border-t-[3px] border-neo-onyx bg-white p-8 md:col-span-4 md:border-t-0 md:border-l-[3px] md:p-10"
          variants={heroCol3Variants}
          transition={prefersReducedMotion ? reducedMotionTransition : undefined}
          {...motionProps}
        >
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
        </motion.div>

        {!prefersReducedMotion ? (
          <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 md:block">
            <motion.div
              className="flex flex-col items-center"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="mb-2 text-xs font-bold uppercase tracking-[0.3em]">Desplazar</span>
              <div className="h-12 w-px bg-neo-onyx" />
            </motion.div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
