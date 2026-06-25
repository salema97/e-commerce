import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ReferralConversionStatus, ReferralPayoutMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { StoreCreditService } from '../returns/store-credit.service.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import { ReferralEngine } from './referral.engine.js';

@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: ReferralEngine,
    private readonly storeCredit: StoreCreditService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async getOrCreateCode(userId: string) {
    const existing = await this.prisma.referralCode.findUnique({ where: { userId } });
    if (existing) {
      return this.toCodeResponse(existing);
    }

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const base = user.email.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() ?? 'USER';
    const code = `${base}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const created = await this.prisma.referralCode.create({
      data: { userId, code },
    });

    return this.toCodeResponse(created);
  }

  async recordConversion(orderId: string, referralCodeRaw: string, referredUserId?: string) {
    const code = this.engine.normalizeCode(referralCodeRaw);
    const referral = await this.prisma.referralCode.findFirst({
      where: { code, isActive: true },
    });

    if (!referral || referral.userId === referredUserId) {
      return null;
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return null;
    }

    const commissionAmount = this.engine.calculateCommission(Number(order.total));

    return this.prisma.referralConversion.upsert({
      where: { orderId },
      create: {
        referralCodeId: referral.id,
        referredUserId,
        orderId,
        commissionAmount,
      },
      update: {},
    });
  }

  async performanceReport(userId?: string) {
    const where = userId
      ? { referralCode: { userId } }
      : {};

    const conversions = await this.prisma.referralConversion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { referralCode: { include: { user: { select: { email: true, name: true } } } } },
    });

    const pendingCommission = conversions
      .filter((row) => row.status === ReferralConversionStatus.PENDING)
      .reduce((sum, row) => sum + Number(row.commissionAmount), 0);

    const paidCommission = conversions
      .filter((row) => row.status === ReferralConversionStatus.PAID)
      .reduce((sum, row) => sum + Number(row.commissionAmount), 0);

    return {
      totalConversions: conversions.length,
      pendingCommission,
      paidCommission,
      conversions: conversions.map((row) => ({
        ...row,
        commissionAmount: Number(row.commissionAmount),
      })),
    };
  }

  async payout(conversionId: string, method: ReferralPayoutMethod) {
    const conversion = await this.prisma.referralConversion.findUnique({
      where: { id: conversionId },
      include: { referralCode: true },
    });

    if (!conversion) {
      throw new NotFoundException(`Referral conversion ${conversionId} not found`);
    }

    if (conversion.status !== ReferralConversionStatus.PENDING) {
      throw new BadRequestException('Conversion already processed');
    }

    if (method === ReferralPayoutMethod.STORE_CREDIT) {
      await this.storeCredit.issue({
        userId: conversion.referralCode.userId,
        amount: Number(conversion.commissionAmount),
      });
    }

    const updated = await this.prisma.referralConversion.update({
      where: { id: conversionId },
      data: {
        status: ReferralConversionStatus.PAID,
        payoutMethod: method,
        paidAt: new Date(),
      },
    });

    await this.loyaltyService.earnForReferral(conversion.referralCode.userId, conversion.id);
    return updated;
  }

  private toCodeResponse(record: { id: string; userId: string; code: string; isActive: boolean; createdAt: Date }) {
    return {
      id: record.id,
      userId: record.userId,
      code: record.code,
      isActive: record.isActive,
      link: this.engine.buildReferralLink(record.code),
      createdAt: record.createdAt.toISOString(),
    };
  }
}
