import { BadRequestException, Injectable } from '@nestjs/common';
import { LoyaltyTier, LoyaltyTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoyaltyEngine } from './loyalty.engine.js';

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: LoyaltyEngine,
  ) {}

  async getOrCreateAccount(userId: string) {
    const account = await this.prisma.loyaltyAccount.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    await this.expireStalePoints(account.id);

    const fresh = await this.prisma.loyaltyAccount.findUniqueOrThrow({ where: { userId } });
    return this.toResponse(fresh);
  }

  hasFreeShippingBenefit(tier: string): boolean {
    return this.engine.tierIncludesFreeShipping(tier as LoyaltyTier);
  }

  async earnSignupBonus(userId: string) {
    const existing = await this.prisma.loyaltyTransaction.findFirst({
      where: { account: { userId }, reason: 'signup_bonus' },
    });
    if (existing) {
      return this.getOrCreateAccount(userId);
    }

    await this.addPoints(userId, this.engine.rules.signup, 'signup_bonus');
    return this.getOrCreateAccount(userId);
  }

  async earnForPurchase(userId: string, orderId: string, orderTotal: number) {
    const points = this.engine.pointsForPurchase(orderTotal);
    if (points <= 0) {
      return;
    }
    await this.addPoints(userId, points, 'purchase', orderId);
  }

  async earnForReview(userId: string, reviewId: string) {
    await this.addPoints(userId, this.engine.rules.review, `review:${reviewId}`);
  }

  async earnForReferral(userId: string, conversionId: string) {
    await this.addPoints(userId, this.engine.rules.referral, `referral:${conversionId}`);
  }

  async quoteRedemption(userId: string, orderSubtotal: number, requestedPoints?: number) {
    const account = await this.getOrCreateAccount(userId);
    const maxRedeemablePoints = this.engine.maxRedeemable(account.points, orderSubtotal);
    const points = Math.min(requestedPoints ?? maxRedeemablePoints, maxRedeemablePoints);

    return {
      points,
      discountAmount: this.engine.discountForPoints(points),
      maxRedeemablePoints,
    };
  }

  async redeem(userId: string, points: number, orderId: string) {
    if (points <= 0) {
      throw new BadRequestException('Points must be greater than zero');
    }

    const account = await this.prisma.loyaltyAccount.findUnique({ where: { userId } });
    if (!account || account.points < points) {
      throw new BadRequestException('Insufficient loyalty points');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: { points: { decrement: points } },
      });

      await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: LoyaltyTransactionType.REDEEM,
          points: -points,
          reason: 'checkout_redemption',
          orderId,
        },
      });
    });

    const updated = await this.prisma.loyaltyAccount.findUniqueOrThrow({ where: { userId } });
    await this.syncTier(updated.id);
  }

  async listTransactions(userId: string, limit = 50) {
    const account = await this.prisma.loyaltyAccount.findUnique({ where: { userId } });
    if (!account) {
      return [];
    }

    return this.prisma.loyaltyTransaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private async addPoints(userId: string, points: number, reason: string, orderId?: string) {
    const account = await this.prisma.loyaltyAccount.upsert({
      where: { userId },
      create: { userId, points },
      update: { points: { increment: points } },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.engine.expirationDays);

    await this.prisma.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        type: LoyaltyTransactionType.EARN,
        points,
        reason,
        orderId,
        expiresAt,
      },
    });

    await this.syncTier(account.id);
  }

  private async syncTier(accountId: string) {
    const account = await this.prisma.loyaltyAccount.findUniqueOrThrow({ where: { id: accountId } });
    const tier = this.engine.tierForPoints(account.points);
    if (tier !== account.tier) {
      await this.prisma.loyaltyAccount.update({ where: { id: accountId }, data: { tier } });
    }
  }

  private async expireStalePoints(accountId: string) {
    const now = new Date();
    const expired = await this.prisma.loyaltyTransaction.findMany({
      where: {
        accountId,
        type: LoyaltyTransactionType.EARN,
        expiresAt: { lt: now },
        points: { gt: 0 },
      },
    });

    if (expired.length === 0) {
      return;
    }

    const totalExpired = expired.reduce((sum, row) => sum + row.points, 0);
    await this.prisma.$transaction(async (tx) => {
      await tx.loyaltyAccount.update({
        where: { id: accountId },
        data: { points: { decrement: totalExpired } },
      });
      await tx.loyaltyTransaction.create({
        data: {
          accountId,
          type: LoyaltyTransactionType.EXPIRE,
          points: -totalExpired,
          reason: 'points_expired',
        },
      });
    });
  }

  private toResponse(account: { id: string; userId: string; points: number; tier: string; createdAt: Date; updatedAt: Date }) {
    return {
      id: account.id,
      userId: account.userId,
      points: account.points,
      tier: account.tier,
      pointsValue: this.engine.discountForPoints(account.points),
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }
}
