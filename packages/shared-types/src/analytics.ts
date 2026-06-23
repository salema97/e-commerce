export const ECOMMERCE_ANALYTICS_EVENTS = [
  'product_view',
  'add_to_cart',
  'remove_from_cart',
  'begin_checkout',
  'purchase',
  'search',
  'filter',
] as const;

export type EcommerceAnalyticsEventName = (typeof ECOMMERCE_ANALYTICS_EVENTS)[number];

export const DOMAIN_EVENT_NAMES = [
  'order.paid',
  'order.shipped',
  'product.updated',
  'inventory.changed',
] as const;

export type DomainEventName = (typeof DOMAIN_EVENT_NAMES)[number];

export interface AnalyticsEventInput {
  event: EcommerceAnalyticsEventName;
  properties?: Record<string, unknown>;
  sessionId?: string;
  userId?: string;
  source?: 'web' | 'mobile' | 'api';
}

export interface DomainEventPayload {
  orderId?: string;
  productId?: string;
  inventoryId?: string;
  [key: string]: unknown;
}

export interface DomainEvent {
  name: DomainEventName;
  payload: DomainEventPayload;
  occurredAt?: string;
}

export interface AnalyticsOverviewReport {
  revenue: number;
  orders: number;
  paidOrders: number;
  conversionRate: number;
  topProducts: Array<{ productId: string; name: string; quantity: number }>;
}

export interface CohortRetentionRow {
  cohortWeek: string;
  cohortSize: number;
  /** Retention % by week offset from cohort start (index 0 = cohort week). */
  retentionByWeek: number[];
}

export interface CohortRetentionReport {
  weeks: number;
  cohorts: CohortRetentionRow[];
}
