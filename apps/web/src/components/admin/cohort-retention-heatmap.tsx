'use client';

import { cn } from '@/lib/utils';

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
