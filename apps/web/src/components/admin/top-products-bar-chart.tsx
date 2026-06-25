'use client';

import { cn } from '@/lib/utils';

export function TopProductsBarChart({
  products,
  className,
}: {
  products: Array<{ name: string; quantity: number }>;
  className?: string;
}) {
  const max = Math.max(...products.map((product) => product.quantity), 1);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {products.map((product) => {
        const widthPercent = Math.round((product.quantity / max) * 100);
        return (
          <div key={product.name} className="grid gap-1">
            <div className="flex items-center justify-between gap-2 text-sm font-medium">
              <span className="truncate">{product.name}</span>
              <span className="shrink-0 border-[2px] border-neo-onyx bg-neo-gold px-2 py-0.5 text-xs font-bold">
                {product.quantity} uds.
              </span>
            </div>
            <div className="h-3 border-[2px] border-neo-onyx bg-white">
              <div
                className="h-full bg-neo-scarlet/80"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
