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
  'product.deleted',
  'inventory.changed',
  'invoice.authorized',
  'alert.sri_dlq',
  'alert.webhook_failure',
  'alert.5xx_spike',
] as const;

export type DomainEventName = (typeof DOMAIN_EVENT_NAMES)[number];

export const ALERT_EVENT_NAMES = {
  SRI_DLQ: 'alert.sri_dlq',
  WEBHOOK_FAILURE: 'alert.webhook_failure',
  FIVE_XX_SPIKE: 'alert.5xx_spike',
} as const satisfies Record<string, DomainEventName>;

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
  invoiceId?: string;
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
