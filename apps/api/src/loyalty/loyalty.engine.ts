import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoyaltyTier } from '@prisma/client';

export interface LoyaltyEarnRule {
  signup: number;
  review: number;
  referral: number;
  purchasePerDollar: number;
}

export interface LoyaltyTierBenefit {
  tier: LoyaltyTier;
  minPoints: number;
  discountMultiplier: number;
  freeShippingThreshold?: number;
}

@Injectable()
export class LoyaltyEngine {
  constructor(private readonly config: ConfigService) {}

  get rules(): LoyaltyEarnRule {
    return {
      signup: this.config.get<number>('LOYALTY_SIGNUP_POINTS', 25),
      review: this.config.get<number>('LOYALTY_REVIEW_POINTS', 50),
      referral: this.config.get<number>('LOYALTY_REFERRAL_POINTS', 100),
      purchasePerDollar: this.config.get<number>('LOYALTY_PURCHASE_POINTS_PER_DOLLAR', 1),
    };
  }

  get pointValue(): number {
    return this.config.get<number>('LOYALTY_POINT_VALUE', 0.01);
  }

  get expirationDays(): number {
    return this.config.get<number>('LOYALTY_POINTS_EXPIRATION_DAYS', 365);
  }

  tierForPoints(points: number): LoyaltyTier {
    if (points >= 5000) return LoyaltyTier.PLATINUM;
    if (points >= 2000) return LoyaltyTier.GOLD;
    if (points >= 500) return LoyaltyTier.SILVER;
    return LoyaltyTier.BRONZE;
  }

  pointsForPurchase(total: number): number {
    return Math.floor(total * this.rules.purchasePerDollar);
  }

  discountForPoints(points: number): number {
    return Number((points * this.pointValue).toFixed(2));
  }

  maxRedeemable(points: number, orderSubtotal: number): number {
    const maxByBalance = points;
    const maxByOrder = Math.floor(orderSubtotal / this.pointValue);
    return Math.max(0, Math.min(maxByBalance, maxByOrder));
  }

  tierIncludesFreeShipping(tier: LoyaltyTier): boolean {
    return tier === LoyaltyTier.GOLD || tier === LoyaltyTier.PLATINUM;
  }
}
