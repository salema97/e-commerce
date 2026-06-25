import type { PromotionType } from './enums.js';

export interface DiscountRule {
  id: string;
  promotionId: string;
  minimumQuantity?: number | null;
  minimumAmount?: number | null;
  applicableProductId?: string | null;
  applicableCategoryId?: string | null;
  createdAt: string;
  promotion?: unknown;
}

export interface Coupon {
  id: string;
  code: string;
  promotionId: string;
  usageLimit?: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  promotion?: unknown;
}

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  value?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  coupons?: Coupon[];
  discountRules?: DiscountRule[];
}

export interface CreatePromotionDto {
  name: string;
  type: PromotionType;
  value?: number;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}

export type UpdatePromotionDto = Partial<CreatePromotionDto>;

export interface CreateCouponDto {
  code: string;
  promotionId: string;
  usageLimit?: number;
  isActive?: boolean;
}

export type UpdateCouponDto = Partial<CreateCouponDto>;

export interface ApplyCouponDto {
  code: string;
  cartId?: string;
  orderId?: string;
}

export interface PromotionResult {
  discountAmount: number;
  finalTotal: number;
  appliedPromotionIds: string[];
  appliedCouponCode?: string;
}

export type MarketingSegment =
  | 'ALL_CUSTOMERS'
  | 'HAS_ACTIVE_CART'
  | 'RECENT_BUYERS'
  | 'INACTIVE_BUYERS';

export interface DistributePromoDto {
  segment: MarketingSegment;
  promotionId: string;
}

export interface DistributePromoResponse {
  status: 'queued';
}
