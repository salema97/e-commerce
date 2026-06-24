export type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'PAUSED'
  | 'CANCELLED'
  | 'EXPIRED';

export type SubscriptionInterval = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface SubscriptionPlan {
  id: string;
  productId: string;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
  interval: SubscriptionInterval;
  intervalCount: number;
  trialDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product?: unknown;
}

export interface CustomerSubscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId?: string | null;
  status: SubscriptionStatus;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlan;
}

export interface CreateSubscriptionPlanDto {
  productId: string;
  stripeProductId?: string;
  stripePriceId?: string;
  interval?: SubscriptionInterval;
  intervalCount?: number;
  trialDays?: number;
  isActive?: boolean;
}

export type UpdateSubscriptionPlanDto = Partial<Omit<CreateSubscriptionPlanDto, 'productId'>>;

export interface CreateCustomerSubscriptionDto {
  planId: string;
  paymentMethodId?: string;
}
