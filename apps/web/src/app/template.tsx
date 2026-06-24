'use client';

import { NeoPageTransition } from '@/components/motion/neo-page-transition';

export default function Template({ children }: { children: React.ReactNode }) {
  return <NeoPageTransition>{children}</NeoPageTransition>;
}
