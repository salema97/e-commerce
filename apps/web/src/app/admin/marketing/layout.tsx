import { MarketingSubNav } from '@/components/admin/marketing-sub-nav';
import { requireMarketingAccess } from '@/lib/marketing-page';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMarketingAccess('/admin/marketing');

  return (    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <MarketingSubNav />
      {children}
    </div>
  );
}
