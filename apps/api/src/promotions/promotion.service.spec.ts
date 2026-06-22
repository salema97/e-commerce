import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PromotionService } from './promotion.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PromotionType } from '@prisma/client';

function buildCoupon(overrides: Partial<{
  type: PromotionType;
  value: Prisma.Decimal | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  usageLimit: number | null;
  usageCount: number;
  minimumAmount: Prisma.Decimal | null;
  minimumQuantity: number | null;
}> = {}) {
  const {
    type = PromotionType.PERCENTAGE,
    value = new Prisma.Decimal(10),
    startsAt = null,
    endsAt = null,
    isActive = true,
    usageLimit = null,
    usageCount = 0,
    minimumAmount = null,
    minimumQuantity = null,
  } = overrides;
  return {
    id: 'c1',
    code: 'SAVE10',
    usageLimit,
    usageCount,
    isActive,
    promotion: {
      id: 'p1',
      name: 'Save 10',
      type,
      value,
      startsAt,
      endsAt,
      isActive: true,
      discountRules: minimumAmount || minimumQuantity
        ? [{ id: 'r1', minimumQuantity, minimumAmount }]
        : [],
    },
  };
}

describe('PromotionService', () => {
  let service: PromotionService;
  let prisma: {
    coupon: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    prisma = {
      coupon: { findUnique: vi.fn(), update: vi.fn().mockResolvedValue({}) },
    };
    const module = await Test.createTestingModule({
      providers: [PromotionService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(PromotionService);
  });

  const items = [{ productId: 'p1', price: 50, quantity: 2 }]; // subtotal 100

  describe('validateCoupon', () => {
    it('validates a healthy coupon', async () => {
      prisma.coupon.findUnique.mockResolvedValue(buildCoupon());
      const { coupon, subtotal } = await service.validateCoupon('SAVE10', items);
      expect(coupon.code).toBe('SAVE10');
      expect(subtotal).toBe(100);
    });

    it('throws NotFound for unknown code', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);
      await expect(service.validateCoupon('NOPE', items)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects inactive coupon', async () => {
      prisma.coupon.findUnique.mockResolvedValue(buildCoupon({ isActive: false }));
      await expect(service.validateCoupon('SAVE10', items)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects not-yet-valid coupon', async () => {
      const future = new Date(Date.now() + 86_400_000);
      prisma.coupon.findUnique.mockResolvedValue(buildCoupon({ startsAt: future }));
      await expect(service.validateCoupon('SAVE10', items)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects expired coupon', async () => {
      const past = new Date(Date.now() - 86_400_000);
      prisma.coupon.findUnique.mockResolvedValue(buildCoupon({ endsAt: past }));
      await expect(service.validateCoupon('SAVE10', items)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when usage limit reached', async () => {
      prisma.coupon.findUnique.mockResolvedValue(buildCoupon({ usageLimit: 5, usageCount: 5 }));
      await expect(service.validateCoupon('SAVE10', items)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when subtotal below minimumAmount', async () => {
      prisma.coupon.findUnique.mockResolvedValue(buildCoupon({ minimumAmount: new Prisma.Decimal(200) }));
      await expect(service.validateCoupon('SAVE10', items)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when quantity below minimumQuantity', async () => {
      prisma.coupon.findUnique.mockResolvedValue(buildCoupon({ minimumQuantity: 10 }));
      await expect(service.validateCoupon('SAVE10', items)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('applyPromotion', () => {
    it('applies percentage discount', async () => {
      prisma.coupon.findUnique.mockResolvedValue(buildCoupon({ type: PromotionType.PERCENTAGE, value: new Prisma.Decimal(10) }));
      const applied = await service.applyPromotion('SAVE10', items);
      expect(applied.discount).toBe(10);
      expect(applied.type).toBe(PromotionType.PERCENTAGE);
    });

    it('caps fixed_amount discount at subtotal', async () => {
      prisma.coupon.findUnique.mockResolvedValue(buildCoupon({ type: PromotionType.FIXED_AMOUNT, value: new Prisma.Decimal(150) }));
      const applied = await service.applyPromotion('SAVE10', items);
      expect(applied.discount).toBe(100);
    });

    it('flags free shipping', async () => {
      prisma.coupon.findUnique.mockResolvedValue(buildCoupon({ type: PromotionType.FREE_SHIPPING, value: null }));
      const applied = await service.applyPromotion('SAVE10', items);
      expect(applied.freeShipping).toBe(true);
      expect(applied.discount).toBe(0);
    });
  });

  describe('calculateOrderTotals', () => {
    it('computes totals with 15% IVA and no coupon', async () => {
      const totals = await service.calculateOrderTotals(items);
      // subtotal 100, discount 0, tax 15, total 115
      expect(totals.subtotal).toBe(100);
      expect(totals.taxAmount).toBe(15);
      expect(totals.discount).toBe(0);
      expect(totals.total).toBe(115);
      expect(prisma.coupon.findUnique).not.toHaveBeenCalled();
    });

    it('computes totals with percentage coupon', async () => {
      prisma.coupon.findUnique.mockResolvedValue(buildCoupon({ type: PromotionType.PERCENTAGE, value: new Prisma.Decimal(10) }));
      const totals = await service.calculateOrderTotals(items, 'SAVE10');
      // subtotal 100, discount 10, taxable 90, tax 13.5, total 103.5
      expect(totals.discount).toBe(10);
      expect(totals.taxAmount).toBe(13.5);
      expect(totals.total).toBe(103.5);
    });

    it('rounds to 2 decimals', async () => {
      const oddItems = [{ productId: 'p1', price: 19.99, quantity: 2 }]; // 39.98
      const totals = await service.calculateOrderTotals(oddItems);
      // tax 39.98 * 0.15 = 5.997 -> 6.00, total 45.98
      expect(totals.subtotal).toBe(39.98);
      expect(totals.taxAmount).toBe(6);
      expect(totals.total).toBe(45.98);
    });
  });

  describe('incrementCouponUsage', () => {
    it('increments usage count', async () => {
      await service.incrementCouponUsage('SAVE10');
      expect(prisma.coupon.update).toHaveBeenCalledWith({ where: { code: 'SAVE10' }, data: { usageCount: { increment: 1 } } });
    });

    it('swallows errors silently', async () => {
      prisma.coupon.update.mockRejectedValue(new Error('boom'));
      await expect(service.incrementCouponUsage('SAVE10')).resolves.toBeUndefined();
    });
  });
});
