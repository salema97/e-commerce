import * as React from 'react';
import { cn } from '@/lib/utils';

export function AlertTitle({
  className,
  children,
  ref,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { ref?: React.Ref<HTMLParagraphElement> }) {
  return (
    <h5
      ref={ref}
      className={cn('mb-1 font-bold uppercase leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h5>
  );
}
