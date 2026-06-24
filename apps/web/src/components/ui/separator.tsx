import * as React from 'react';
import { cn } from '@/lib/utils';

export function Separator({
  className,
  orientation = 'horizontal',
  ref,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  orientation?: 'horizontal' | 'vertical';
  ref?: React.Ref<HTMLElement>;
}) {
  const sharedClassName = cn(
    'shrink-0 border-0 bg-neo-onyx',
    orientation === 'horizontal' ? 'h-[3px] w-full' : 'h-full w-[3px]',
    className,
  );

  if (orientation === 'vertical') {
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        aria-orientation="vertical"
        className={sharedClassName}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      />
    );
  }

  return (
    <hr
      ref={ref as React.Ref<HTMLHRElement>}
      className={sharedClassName}
      {...(props as React.HTMLAttributes<HTMLHRElement>)}
    />
  );
}
