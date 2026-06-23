import { z } from 'zod';
import { ECOMMERCE_ANALYTICS_EVENTS } from '@repo/shared-types';

export const analyticsEventSchema = z.object({
  event: z.enum(ECOMMERCE_ANALYTICS_EVENTS),
  properties: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().max(128).optional(),
  userId: z.string().max(128).optional(),
  source: z.enum(['web', 'mobile', 'api']).optional(),
});

export type AnalyticsEventSchema = z.infer<typeof analyticsEventSchema>;
