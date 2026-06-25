'use client';

import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/utils';

const ToggleGroupContext = React.createContext<{ size?: 'default' | 'sm' }>({ size: 'default' });

export function ToggleGroup({
  className,
  size = 'default',
  children,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & {
  size?: 'default' | 'sm';
  ref?: React.Ref<React.ElementRef<typeof ToggleGroupPrimitive.Root>>;
}) {
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn('flex flex-col gap-2 sm:flex-row', className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ size }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

export function ToggleGroupItem({
  className,
  children,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & {
  ref?: React.Ref<React.ElementRef<typeof ToggleGroupPrimitive.Item>>;
}) {
  const { size } = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        'inline-flex flex-1 items-center justify-center border-[3px] border-neo-onyx bg-white px-5 py-2 text-sm font-bold uppercase tracking-wide text-neo-onyx shadow-[4px_4px_0_0_#111111] transition-colors hover:bg-neo-gold focus-visible:bg-neo-gold focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-neo-onyx data-[state=on]:text-white btn-brutal',
        size === 'sm' && 'h-9 px-3 text-xs',
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}
