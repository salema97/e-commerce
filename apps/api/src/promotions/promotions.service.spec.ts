import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PromotionType } from '@prisma/client';
import { PromotionsService } from './promotions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('PromotionsService', () => {
  let service: PromotionsService;
  let promotionFindUnique: ReturnType<typeof vi.fn>;
  let promotionCreate: ReturnType<typeof vi.fn>;
  let couponFindUnique: ReturnType<typeof vi.fn>;
  let couponCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    promotionFindUnique = vi.fn();
    promotionCreate = vi.fn();
    couponFindUnique = vi.fn().mockResolvedValue(null);
    couponCreate = vi.fn();

    const prisma = {
      promotion: {
        findMany: vi.fn(),
        findUnique: promotionFindUnique,
        create: promotionCreate,
        update: vi.fn(),
        delete: vi.fn(),
      },
      coupon: {
        findUnique: couponFindUnique,
        create: couponCreate,
        update: vi.fn(),
        delete: vi.fn(),
      },
      discountRule: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as PrismaService;

    service = new PromotionsService(prisma);
  });

  describe('create', () => {
    it('creates a percentage promotion with value', async () => {
      const created = {
        id: 'p1',
        name: 'Summer Sale',
        type: PromotionType.PERCENTAGE,
        value: 15,
      };
      promotionCreate.mockResolvedValue(created);

      const result = await service.create({
        name: 'Summer Sale',
        type: PromotionType.PERCENTAGE,
        value: 15,
      });

      expect(result).toEqual(created);
    });

    it('rejects when endsAt is not after startsAt', async () => {
      await expect(
        service.create({
          name: 'Invalid Window',
          type: PromotionType.FREE_SHIPPING,
          startsAt: '2026-07-01T00:00:00.000Z',
          endsAt: '2026-06-01T00:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('createCoupon', () => {
    it('normalizes coupon code to uppercase', async () => {
      promotionFindUnique.mockResolvedValue({
        id: 'p1',
        coupons: [],
        discountRules: [],
      });
      couponCreate.mockResolvedValue({ id: 'c1', code: 'SAVE10' });

      await service.createCoupon('p1', { code: ' save10 ' });

      expect(couponCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ code: 'SAVE10', promotionId: 'p1' }),
      });
    });

    it('rejects duplicate coupon codes', async () => {
      promotionFindUnique.mockResolvedValue({
        id: 'p1',
        coupons: [],
        discountRules: [],
      });
      couponFindUnique.mockResolvedValue({ id: 'existing', code: 'SAVE10' });

      await expect(service.createCoupon('p1', { code: 'save10' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws when promotion does not exist', async () => {
      promotionFindUnique.mockResolvedValue(null);

      await expect(service.createCoupon('missing', { code: 'SAVE10' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
