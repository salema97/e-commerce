import * as React from 'react';
import { cn } from '@/lib/utils';

const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: 'horizontal' | 'vertical' }
>(({ className, orientation = 'horizontal', ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    aria-orientation={orientation}
    className={cn(
      'shrink-0 bg-neo-onyx',
      orientation === 'horizontal' ? 'h-[3px] w-full' : 'h-full w-[3px]',
      className,
    )}
    {...props}
  />
));
Separator.displayName = 'Separator';

export { Separator };
