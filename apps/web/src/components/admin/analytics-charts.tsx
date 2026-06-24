'use client';

import * as React from 'react';
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
              <div
                className="h-full bg-neo-gold transition-[width] duration-500"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

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

function retentionTone(rate: number): string {
  if (rate >= 60) return 'bg-neo-gold';
  if (rate >= 30) return 'bg-neo-lace';
  if (rate > 0) return 'bg-white';
  return 'bg-neo-onyx/10';
}

export function CohortRetentionHeatmap({
  cohorts,
  className,
}: {
  cohorts: Array<{ cohortWeek: string; cohortSize: number; retentionByWeek: number[] }>;
  className?: string;
}) {
  const weekCount = cohorts[0]?.retentionByWeek.length ?? 0;

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[32rem] text-sm">
        <thead>
          <tr className="border-b-[3px] border-neo-onyx text-left font-bold text-muted-foreground">
            <th className="py-2 pr-4 text-neo-onyx">Semana cohorte</th>
            <th className="py-2 pr-4 text-neo-onyx">Clientes</th>
            {Array.from({ length: weekCount }, (_, weekIndex) => (
              <th key={`retention-week-${weekIndex}`} className="py-2 pr-2 text-neo-onyx">
                Semana {weekIndex}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => (
            <tr key={cohort.cohortWeek} className="border-b border-neo-onyx/20 last:border-0">
              <td className="py-3 pr-4 font-bold">{cohort.cohortWeek}</td>
              <td className="py-3 pr-4">{cohort.cohortSize}</td>
              {cohort.retentionByWeek.map((rate, weekIndex) => (
                <td key={`${cohort.cohortWeek}-w${weekIndex}`} className="py-2 pr-2">
                  <div
                    className={cn(
                      'border-[2px] border-neo-onyx px-2 py-1 text-center text-xs font-bold',
                      retentionTone(rate),
                    )}
                    title={`${rate}% retención`}
                  >
                    {rate}%
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
