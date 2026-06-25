import { getServerApiClient } from '@/lib/api';
import { requireFinanceAccess } from '@/lib/finance-page';
import type {
  AnalyticsOverviewReport,
  CohortRetentionReport,
} from '@repo/shared-types';
import { AnalyticsView } from './analytics-view';

export default async function AdminAnalyticsPage() {
  await requireFinanceAccess('/admin/analytics');
  const api = await getServerApiClient();

  const [overview, funnel, cohorts] = await Promise.allSettled([
    api.analytics.getOverview(30),
    api.analytics.getFunnel(30),
    api.analytics.getCohorts(8),
  ]);

  const initialOverview: AnalyticsOverviewReport | null =
    overview.status === 'fulfilled' ? overview.value : null;
  const initialFunnel: Record<string, number> | null =
    funnel.status === 'fulfilled' ? funnel.value : null;
  const initialCohorts: CohortRetentionReport | null =
    cohorts.status === 'fulfilled' ? cohorts.value : null;

  return (
    <AnalyticsView
      initialOverview={initialOverview}
      initialFunnel={initialFunnel}
      initialCohorts={initialCohorts}
      initialOverviewDays={30}
    />
  );
}
