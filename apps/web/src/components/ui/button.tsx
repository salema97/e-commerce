import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 btn-brutal',
  {
    variants: {
      variant: {
        default:
          'bg-neo-onyx text-white border-[3px] border-neo-onyx shadow-[6px_6px_0_0_#FFD800] hover:bg-neo-scarlet',
        destructive:
          'bg-neo-scarlet text-white border-[3px] border-neo-onyx shadow-[6px_6px_0_0_#111111] hover:bg-neo-gold hover:text-neo-onyx',
        outline:
          'border-[3px] border-neo-onyx bg-white text-neo-onyx shadow-[4px_4px_0_0_#111111] hover:bg-neo-gold',
        secondary:
          'bg-neo-gold text-neo-onyx border-[3px] border-neo-onyx shadow-[4px_4px_0_0_#111111] hover:bg-white',
        ghost: 'border-[3px] border-transparent hover:bg-neo-gold hover:border-neo-onyx',
        link: 'border-0 shadow-none underline-offset-4 hover:underline normal-case',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-14 px-8 text-base font-anton',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  ref,
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
}

export { buttonVariants };
