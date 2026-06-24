'use client';

import { stagger, type Transition, type Variants } from 'motion/react';
import {
  neoMotionDurations,
  neoMotionEasings,
  neoMotionOffsets,
  neoMotionStagger,
} from '@repo/shared-utils';

export const reducedMotionTransition: Transition = { duration: 0 };

export const heroCol1Variants: Variants = {
  hidden: { x: '-100%' },
  visible: {
    x: 0,
    transition: { duration: neoMotionDurations.slow, ease: neoMotionEasings.expoOut },
  },
};

export const heroCol3Variants: Variants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: { duration: neoMotionDurations.slow, ease: neoMotionEasings.expoOut },
  },
};

export const heroCol2Variants: Variants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: neoMotionDurations.hero,
      ease: neoMotionEasings.backOut,
      delay: 0.2,
    },
  },
};

export const bentoContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: neoMotionStagger.bento,
      delayChildren: 0.05,
    },
  },
};

export const bentoItemVariants: Variants = {
  hidden: { y: neoMotionOffsets.bentoY, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: neoMotionDurations.slow, ease: neoMotionEasings.power4Out },
  },
};

export const kanbanColumnVariants: Variants = {
  hidden: { opacity: 0, x: `${neoMotionOffsets.kanbanColumnXPercent}%` },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: neoMotionDurations.slow,
      ease: neoMotionEasings.power4Out,
      delay: index * neoMotionStagger.kanbanColumn,
    },
  }),
};

export const kanbanCardVariants: Variants = {
  hidden: { opacity: 0, y: neoMotionOffsets.kanbanCardY },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: neoMotionDurations.normal, ease: neoMotionEasings.backOut },
  },
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: neoMotionOffsets.headerY },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: neoMotionDurations.slow, ease: neoMotionEasings.backOut },
  },
};

export const fadeDownVariants: Variants = {
  hidden: { opacity: 0, y: -neoMotionOffsets.headerY },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: neoMotionDurations.slow, ease: neoMotionEasings.backOut },
  },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: neoMotionDurations.normal, ease: neoMotionEasings.power4Out },
  },
};

export const productGridVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: neoMotionStagger.productGrid },
  },
};

export const productCardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: neoMotionDurations.normal, ease: neoMotionEasings.power4Out },
  },
};

export const sidebarIconHover = {
  scale: 1.1,
  rotate: 5,
  transition: { duration: neoMotionDurations.fast },
};

export const sidebarIconRest = {
  scale: 1,
  rotate: 0,
  transition: { duration: neoMotionDurations.fast },
};

export const bentoHover = {
  y: -neoMotionOffsets.bentoHoverLift,
  x: -neoMotionOffsets.bentoHoverLift,
  boxShadow: '16px 16px 0 0 #111111',
  transition: { duration: neoMotionDurations.fast },
};

export const bentoRest = {
  y: 0,
  x: 0,
  boxShadow: '6px 6px 0 0 #111111',
  transition: { duration: neoMotionDurations.fast },
};

export const pulseScaleKeyframes = {
  scale: [1, 1.05, 1],
  transition: {
    duration: neoMotionDurations.pulse,
    repeat: Infinity,
    ease: neoMotionEasings.sineInOut,
  },
};

export { stagger };
