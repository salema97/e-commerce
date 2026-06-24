import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse border-[3px] border-neo-onyx/15 bg-neo-gold/25 shadow-[4px_4px_0_0_rgba(17,17,17,0.08)]',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
