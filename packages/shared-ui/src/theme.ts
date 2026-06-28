/** Neobrutalist design tokens — single source of truth for web (Tailwind) + mobile (RN). */
export const neo = {
  /** Page background — maps to web `--color-neo-lace` / `bg-neo-lace`. */
  bg: '#FDF5E6',
  lace: '#FDF5E6',
  onyx: '#111111',
  gold: '#FFD800',
  scarlet: '#E60026',
  green: '#22C55E',
  white: '#FFFFFF',
  muted: 'rgba(17, 17, 17, 0.6)',
  borderWidth: 3,
  borderWidthLg: 4,
  shadowSm: { width: 4, height: 4, color: '#111111' },
  shadowMd: { width: 6, height: 6, color: '#111111' },
  shadowLg: { width: 8, height: 8, color: '#111111' },
  shadowXl: { width: 12, height: 12, color: '#111111' },
} as const;

export type NeoColors = typeof neo;
