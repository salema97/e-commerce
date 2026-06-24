import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center border-[2px] border-neo-onyx px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-neo-onyx text-neo-gold',
        secondary: 'bg-neo-gold text-neo-onyx',
        destructive: 'bg-neo-scarlet text-white',
        outline: 'bg-white text-neo-onyx',
        success: 'bg-neo-green text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);
