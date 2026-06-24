'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

export function Switch({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
  ref?: React.Ref<React.ElementRef<typeof SwitchPrimitives.Root>>;
}) {
  return (
    <SwitchPrimitives.Root
      className={cn(
        'peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center border-[3px] border-neo-onyx bg-white shadow-[3px_3px_0_0_#111111] transition-colors focus-visible:bg-neo-gold focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-neo-gold data-[state=unchecked]:bg-white',
        className,
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block size-5 border-[3px] border-neo-onyx bg-neo-onyx transition-transform data-[state=checked]:translate-x-5 data-[state=checked]:bg-neo-onyx data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-neo-onyx',
        )}
      />
    </SwitchPrimitives.Root>
  );
}
