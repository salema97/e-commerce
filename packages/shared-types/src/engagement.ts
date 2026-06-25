export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ProductReview {
  id: string;
  productId: string;
  userId?: string | null;
  orderId?: string | null;
  rating: number;
  title?: string | null;
  body: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
  user?: { name?: string | null; email?: string };
}

export interface CreateProductReviewDto {
  rating: number;
  title?: string;
  body: string;
  orderId?: string;
}

export interface UpdateReviewStatusDto {
  status: ReviewStatus;
}

export interface ProductReviewSummary {
  averageRating: number;
  reviewCount: number;
  distribution: Record<string, number>;
}

export type ReferralConversionStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type ReferralPayoutMethod = 'STORE_CREDIT' | 'EXTERNAL';

export interface ReferralCode {
  id: string;
  userId: string;
  code: string;
  isActive: boolean;
  link: string;
  createdAt: string;
}

export interface ReferralConversion {
  id: string;
  referralCodeId: string;
  referredUserId?: string | null;
  orderId?: string | null;
  commissionAmount: number;
  status: ReferralConversionStatus;
  payoutMethod?: ReferralPayoutMethod | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface ReferralPerformanceReport {
  totalConversions: number;
  pendingCommission: number;
  paidCommission: number;
  conversions: ReferralConversion[];
}

export interface PayoutReferralDto {
  payoutMethod: ReferralPayoutMethod;
}

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface LoyaltyAccount {
  id: string;
  userId: string;
  points: number;
  tier: LoyaltyTier;
  pointsValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  accountId: string;
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST';
  points: number;
  reason: string;
  orderId?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface LoyaltyRedemptionQuote {
  points: number;
  discountAmount: number;
  maxRedeemablePoints: number;
}

export type PreOrderChargeTiming = 'AT_SHIPPING' | 'UPFRONT';

export interface ExternalReviewSummary {
  provider: 'google' | 'trustpilot' | 'console';
  rating: number;
  reviewCount: number;
  profileUrl?: string;
}
