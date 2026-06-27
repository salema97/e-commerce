'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export function TabsTrigger({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
  ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.Trigger>>;
}) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center border-[3px] border-neo-onyx bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neo-onyx shadow-[3px_3px_0_#111111] transition-colors hover:bg-neo-gold/50 focus-visible:bg-neo-gold focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-neo-gold',
        className,
      )}
      {...props}
    />
  );
}
