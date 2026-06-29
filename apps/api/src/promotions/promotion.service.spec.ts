import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PromotionService } from './promotion.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TaxService } from '../tax/tax.service.js';
import { PromotionType } from '@prisma/client';

function buildDiscountRule(
  overrides: Partial<{
    id: string;
    minimumQuantity: number | null;
    minimumAmount: Prisma.Decimal | null;
    applicableProductId: string | null;
    applicableCategoryId: string | null;
    discountValue: Prisma.Decimal | null;
    createdAt: Date;
  }> = {},
) {
  return {
    id: 'r1',
    minimumQuantity: null,
    minimumAmount: null,
    applicableProductId: null,
    applicableCategoryId: null,
    discountValue: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function buildCoupon(
  overrides: Partial<{
    type: PromotionType;
    value: Prisma.Decimal | null;
    startsAt: Date | null;
    endsAt: Date | null;
    isActive: boolean;
    usageLimit: number | null;
    usageCount: number;
    minimumAmount: Prisma.Decimal | null;
    minimumQuantity: number | null;
    discountRules: ReturnType<typeof buildDiscountRule>[];
  }> = {},
) {
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
    discountRules,
  } = overrides;

  const rules =
    discountRules ??
    (minimumAmount || minimumQuantity
      ? [buildDiscountRule({ minimumQuantity, minimumAmount })]
      : []);

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
      discountRules: rules,
    },
  };
}

describe('PromotionService', () => {
  let service: PromotionService;
  let prisma: {
    coupon: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    product: { findMany: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    prisma = {
      coupon: { findUnique: vi.fn(), update: vi.fn().mockResolvedValue({}) },
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'p1', categoryId: 'cat-electronics' },
          { id: 'p2', categoryId: 'cat-apparel' },
        ]),
      },
    };
    const taxService = {
      calculateStandardSubtotalTax: (subtotal: number) => Number((subtotal * 0.15).toFixed(2)),
    };
    const module = await Test.createTestingModule({
      providers: [
        PromotionService,
        { provide: PrismaService, useValue: prisma },
        { provide: TaxService, useValue: taxService },
      ],
    }).compile();
    service = module.get(PromotionService);
  });

  const items = [{ productId: 'p1', price: 50, quantity: 2 }];

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

    it('rejects when subtotal below global minimumAmount', async () => {
      prisma.coupon.findUnique.mockResolvedValue(
        buildCoupon({ minimumAmount: new Prisma.Decimal(200) }),
      );
      await expect(service.validateCoupon('SAVE10', items)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects bundle when a component is missing', async () => {
      prisma.coupon.findUnique.mockResolvedValue(
        buildCoupon({
          type: PromotionType.BUNDLE,
          value: new Prisma.Decimal(10),
          discountRules: [
            buildDiscountRule({ id: 'r1', applicableProductId: 'p1', minimumQuantity: 1 }),
            buildDiscountRule({ id: 'r2', applicableProductId: 'p2', minimumQuantity: 1 }),
          ],
        }),
      );
      await expect(service.validateCoupon('SAVE10', items)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects tiered coupon when no tier matches', async () => {
      prisma.coupon.findUnique.mockResolvedValue(
        buildCoupon({
          type: PromotionType.TIERED,
          value: new Prisma.Decimal(10),
          discountRules: [
            buildDiscountRule({ id: 'r1', minimumQuantity: 10, discountValue: new Prisma.Decimal(15) }),
          ],
        }),
      );
      await expect(service.validateCoupon('SAVE10', items)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('applyPromotion', () => {
    it('applies percentage discount', async () => {
      prisma.coupon.findUnique.mockResolvedValue(
        buildCoupon({ type: PromotionType.PERCENTAGE, value: new Prisma.Decimal(10) }),
      );
      const applied = await service.applyPromotion('SAVE10', items);
      expect(applied.discount).toBe(10);
      expect(applied.lineDiscounts).toEqual([10]);
    });

    it('applies scoped percentage only on eligible lines', async () => {
      const mixedItems = [
        { productId: 'p1', price: 50, quantity: 1 },
        { productId: 'p2', price: 50, quantity: 1 },
      ];
      prisma.coupon.findUnique.mockResolvedValue(
        buildCoupon({
          type: PromotionType.PERCENTAGE,
          value: new Prisma.Decimal(10),
          discountRules: [
            buildDiscountRule({
              applicableCategoryId: 'cat-electronics',
              minimumAmount: new Prisma.Decimal(40),
            }),
          ],
        }),
      );
      const applied = await service.applyPromotion('SAVE10', mixedItems);
      expect(applied.discount).toBe(5);
      expect(applied.lineDiscounts).toEqual([5, 0]);
    });

    it('applies bundle discount on union of eligible lines', async () => {
      const bundleItems = [
        { productId: 'p1', price: 40, quantity: 1 },
        { productId: 'p2', price: 60, quantity: 1 },
      ];
      prisma.coupon.findUnique.mockResolvedValue(
        buildCoupon({
          type: PromotionType.BUNDLE,
          value: new Prisma.Decimal(10),
          discountRules: [
            buildDiscountRule({ id: 'r1', applicableProductId: 'p1' }),
            buildDiscountRule({ id: 'r2', applicableProductId: 'p2' }),
          ],
        }),
      );
      const applied = await service.applyPromotion('SAVE10', bundleItems);
      expect(applied.discount).toBe(10);
      expect(applied.lineDiscounts.reduce((sum, value) => sum + value, 0)).toBe(10);
    });

    it('applies highest tier for tiered promotions', async () => {
      const tieredItems = [{ productId: 'p1', price: 25, quantity: 4 }];
      prisma.coupon.findUnique.mockResolvedValue(
        buildCoupon({
          type: PromotionType.TIERED,
          value: new Prisma.Decimal(8),
          discountRules: [
            buildDiscountRule({
              id: 'r-low',
              minimumQuantity: 2,
              discountValue: new Prisma.Decimal(10),
              createdAt: new Date('2026-01-02T00:00:00.000Z'),
            }),
            buildDiscountRule({
              id: 'r-high',
              minimumQuantity: 4,
              discountValue: new Prisma.Decimal(15),
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
            }),
          ],
        }),
      );
      const applied = await service.applyPromotion('SAVE10', tieredItems);
      expect(applied.discount).toBe(15);
    });

    it('caps fixed_amount discount at subtotal', async () => {
      prisma.coupon.findUnique.mockResolvedValue(
        buildCoupon({ type: PromotionType.FIXED_AMOUNT, value: new Prisma.Decimal(150) }),
      );
      const applied = await service.applyPromotion('SAVE10', items);
      expect(applied.discount).toBe(100);
    });

    it('flags free shipping', async () => {
      prisma.coupon.findUnique.mockResolvedValue(
        buildCoupon({ type: PromotionType.FREE_SHIPPING, value: null }),
      );
      const applied = await service.applyPromotion('SAVE10', items);
      expect(applied.freeShipping).toBe(true);
      expect(applied.discount).toBe(0);
    });
  });

  describe('calculateOrderTotals', () => {
    it('computes totals with 15% IVA and no coupon', async () => {
      const totals = await service.calculateOrderTotals(items);
      expect(totals.subtotal).toBe(100);
      expect(totals.taxAmount).toBe(15);
      expect(totals.discount).toBe(0);
      expect(totals.total).toBe(115);
      expect(prisma.coupon.findUnique).not.toHaveBeenCalled();
    });

    it('computes totals with percentage coupon', async () => {
      prisma.coupon.findUnique.mockResolvedValue(
        buildCoupon({ type: PromotionType.PERCENTAGE, value: new Prisma.Decimal(10) }),
      );
      const totals = await service.calculateOrderTotals(items, 'SAVE10');
      expect(totals.discount).toBe(10);
      expect(totals.taxAmount).toBe(13.5);
      expect(totals.total).toBe(103.5);
    });
  });

  describe('incrementCouponUsage', () => {
    it('increments usage count', async () => {
      await service.incrementCouponUsage('SAVE10');
      expect(prisma.coupon.update).toHaveBeenCalledWith({
        where: { code: 'SAVE10' },
        data: { usageCount: { increment: 1 } },
      });
    });
  });
});
