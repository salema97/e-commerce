import { createApiClient } from '@repo/api-client';
import type { ActiveMarketingPlatform, ActivePlacementsResponse } from '@repo/shared-types';

const publicApi = createApiClient({
  baseURL: process.env.API_BASE_URL ?? 'http://localhost:3001/v1',
});

export async function fetchActiveMarketingPlacements(
  platform: ActiveMarketingPlatform,
): Promise<ActivePlacementsResponse | null> {
  return publicApi.marketing.getActivePlacements(platform).catch(() => null);
}
