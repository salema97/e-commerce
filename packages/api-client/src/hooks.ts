import { createAuthHooks } from './hooks/auth-hooks.js';
import { createCatalogHooks } from './hooks/catalog-hooks.js';
import { createCommerceHooks } from './hooks/commerce-hooks.js';
import { createAdminHooks } from './hooks/admin-hooks.js';
import { createInvoicesHooks } from './hooks/invoices-hooks.js';
import { createPaymentsHooks } from './hooks/payments-hooks.js';
import { createReturnsHooks } from './hooks/returns-hooks.js';
import { createSupportHooks } from './hooks/support-hooks.js';
import { createFinanceHooks } from './hooks/finance-hooks.js';
import { createDiscoveryHooks } from './hooks/discovery-hooks.js';
import { createContentHooks } from './hooks/content-hooks.js';
import { createOpsHooks } from './hooks/ops-hooks.js';
import { createAnalyticsHooks } from './hooks/analytics-hooks.js';
import { createReviewsHooks } from './hooks/reviews-hooks.js';
import { createEngagementHooks } from './hooks/engagement-hooks.js';
import { createPlatformHooks } from './hooks/platform-hooks.js';
import type { ApiClient } from './client.js';

export { queryKeys } from './query-keys.js';

export function createQueryHooks(client: ApiClient) {
  return {
    ...createAuthHooks(client),
    ...createCatalogHooks(client),
    ...createCommerceHooks(client),
    ...createAdminHooks(client),
    ...createInvoicesHooks(client),
    ...createPaymentsHooks(client),
    ...createReturnsHooks(client),
    ...createSupportHooks(client),
    ...createFinanceHooks(client),
    ...createDiscoveryHooks(client),
    ...createContentHooks(client),
    ...createOpsHooks(client),
    ...createAnalyticsHooks(client),
    ...createReviewsHooks(client),
    ...createEngagementHooks(client),
    ...createPlatformHooks(client),
  };
}

export type ApiQueryHooks = ReturnType<typeof createQueryHooks>;
