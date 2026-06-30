'use client';

import { cn } from '@/lib/utils';

interface BarDatum {
  label: string;
  value: number;
}

export function FunnelBarChart({
  steps,
  className,
}: {
  steps: BarDatum[];
  className?: string;
}) {
  const max = Math.max(...steps.map((step) => step.value), 1);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {steps.map((step) => {
        const widthPercent = Math.round((step.value / max) * 100);
        return (
          <div key={step.label} className="grid gap-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase">
              <span className="text-muted-foreground">{step.label}</span>
              <span className="text-neo-onyx">{step.value}</span>
            </div>
            <div className="h-8 border-[3px] border-neo-onyx bg-neo-lace">
              <svg className="h-full w-full" preserveAspectRatio="none">
                <rect
                  className="fill-current text-neo-gold"
                  width={`${widthPercent}%`}
                  height="100%"
                />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
