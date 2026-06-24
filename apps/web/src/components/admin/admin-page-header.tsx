import { cn } from '@/lib/utils';

export interface AdminMetric {
  label: string;
  value: string;
  accent?: boolean;
}

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  showNetworkStatus?: boolean;
  metrics?: AdminMetric[];
  actions?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  eyebrow = 'Panel central',
  title,
  subtitle,
  showNetworkStatus = true,
  metrics,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col justify-between gap-8 border-b-[8px] border-neo-onyx pb-10 xl:flex-row xl:items-end',
        className,
      )}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="bg-neo-onyx px-3 py-1 font-mono text-xs font-black uppercase tracking-[0.2em] text-neo-gold">
            {eyebrow}
          </span>
          {showNetworkStatus ? (
            <span className="flex items-center gap-2 text-xs font-black uppercase">
              <span className="h-3 w-3 animate-pulse rounded-full border border-neo-onyx bg-neo-scarlet" />
              Red activa
            </span>
          ) : null}
        </div>
        <h1 className="font-anton text-5xl uppercase leading-[0.85] tracking-tighter md:text-7xl lg:text-8xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="border-l-8 border-neo-gold pl-6 text-lg font-bold md:text-xl">{subtitle}</p>
        ) : null}
      </div>

      {metrics?.length || actions ? (
        <div className="flex flex-wrap items-end gap-4">
          {metrics?.map((metric) => (
            <div
              key={metric.label}
              className={cn(
                'brutalist-card flex min-w-[160px] flex-col justify-between p-5',
                metric.accent ? 'bg-neo-gold' : 'bg-white',
              )}
            >
              <span className="mb-2 text-xs font-black uppercase text-muted-foreground">
                {metric.label}
              </span>
              <span className="font-anton text-4xl md:text-5xl">{metric.value}</span>
            </div>
          ))}
          {actions}
        </div>
      ) : null}
    </header>
  );
}
