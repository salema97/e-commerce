/** Neo-brutalist motion tokens — shared across web (Motion) and mobile (Reanimated). */

export const neoMotionDurations = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.6,
  slow: 0.8,
  hero: 1,
  pulse: 0.8,
} as const;

/** Cubic-bezier tuples approximating Kombai GSAP easings. */
export const neoMotionEasings = {
  expoOut: [0.16, 1, 0.3, 1] as const,
  backOut: [0.34, 1.56, 0.64, 1] as const,
  power4Out: [0.22, 1, 0.36, 1] as const,
  sineInOut: [0.37, 0, 0.63, 1] as const,
};

export const neoMotionStagger = {
  bento: 0.1,
  kanbanColumn: 0.1,
  listItem: 0.06,
  productGrid: 0.08,
} as const;

export const neoMotionOffsets = {
  bentoY: 60,
  kanbanColumnXPercent: 30,
  kanbanCardY: 40,
  headerY: 50,
  footerY: 50,
  bentoHoverLift: 8,
} as const;

export const neoMotionShadows = {
  bentoRest: '6px 6px 0 0 #111111',
  bentoHover: '16px 16px 0 0 #111111',
  cardRest: '8px 8px 0 0 #111111',
  cardHover: '12px 12px 0 0 #111111',
  brutalBtnRest: '4px 4px 0 0 #111111',
  brutalBtnHover: '10px 10px 0 0 #111111',
} as const;
