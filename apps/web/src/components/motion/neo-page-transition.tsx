'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { m, useReducedMotion } from 'motion/react';
import { fadeUpVariants, reducedMotionTransition } from '@/lib/neo-motion';
import { neoMotionDurations, neoMotionEasings } from '@repo/shared-utils';

interface NeoPageTransitionProps {
  children: React.ReactNode;
}

/** Animación de entrada al cambiar de ruta (template.tsx). */
export function NeoPageTransition({ children }: NeoPageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion || pathname === '/' || pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <m.div
      key={pathname}
      initial="hidden"
      animate="visible"
      variants={fadeUpVariants}
    >
      {children}
    </m.div>
  );
}

/** Contenedor de página con header neo animado + cuerpo escalonado. */
export function NeoPage({
  children,
  className,
  header,
  staggerBody = true,
}: {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  staggerBody?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={className}>
      {header ? (
        <m.div
          variants={fadeUpVariants}
          initial={prefersReducedMotion ? false : 'hidden'}
          animate={prefersReducedMotion ? undefined : 'visible'}
          transition={prefersReducedMotion ? reducedMotionTransition : undefined}
        >
          {header}
        </m.div>
      ) : null}
      {staggerBody ? (
        <NeoStagger className={header ? 'mt-8' : undefined}>{children}</NeoStagger>
      ) : (
        children
      )}
    </div>
  );
}

export function NeoPageHeader({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={className ?? 'border-b-[6px] border-neo-onyx pb-6'}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">{eyebrow}</p>
      ) : null}
      <h1 className="font-anton text-5xl uppercase md:text-7xl">{title}</h1>
      {children}
    </header>
  );
}

export function NeoStagger({
  children,
  className,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  once?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
      }}
      initial={prefersReducedMotion ? false : 'hidden'}
      whileInView={prefersReducedMotion ? undefined : 'visible'}
      viewport={{ once, amount: 0.05 }}
    >
      {children}
    </m.div>
  );
}

export function NeoReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      variants={fadeUpVariants}
      initial={prefersReducedMotion ? false : 'hidden'}
      whileInView={prefersReducedMotion ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.15 }}
      transition={
        prefersReducedMotion
          ? reducedMotionTransition
          : { delay, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }
      }
    >
      {children}
    </m.div>
  );
}

export function NeoItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      variants={fadeUpVariants}
      transition={prefersReducedMotion ? reducedMotionTransition : undefined}
    >
      {children}
    </m.div>
  );
}

/** Shell con header + cuerpo animados en secuencia (patrón común en store/admin). */
export function AnimatedPageShell({
  children,
  header,
  className,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={className}>
        {header}
        {children}
      </div>
    );
  }

  return (
    <div className={className}>
      {header ? (
        <m.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: neoMotionDurations.slow, ease: neoMotionEasings.backOut }}
        >
          {header}
        </m.div>
      ) : null}
      <m.div
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        transition={{
          delay: header ? 0.12 : 0,
          duration: neoMotionDurations.normal,
          ease: neoMotionEasings.power4Out,
        }}
      >
        {children}
      </m.div>
    </div>
  );
}
