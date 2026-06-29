import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  MarketingPlacementPlatform,
  MarketingPlacementSlot,
  MarketingPlacementType,
} from '@prisma/client';
import { MarketingPlacementService } from './marketing-placement.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MarketingPlacementCacheService } from './marketing-placement-cache.service.js';

const baseRow = {
  id: 'p1',
  name: 'Test',
  type: MarketingPlacementType.POPUP,
  slot: MarketingPlacementSlot.APP_LAUNCH,
  platform: MarketingPlacementPlatform.ALL,
  title: 'Title',
  body: null,
  imageUrl: null,
  ctaLabel: null,
  ctaHref: null,
  promotionId: null,
  priority: 10,
  contentVersion: 1,
  showOncePerSession: false,
  showOnceEver: false,
  dismissible: true,
  isActive: true,
  startsAt: null,
  endsAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('MarketingPlacementService', () => {
  let service: MarketingPlacementService;
  let findMany: ReturnType<typeof vi.fn>;
  let findUnique: ReturnType<typeof vi.fn>;
  let create: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let del: ReturnType<typeof vi.fn>;
  let cacheGet: ReturnType<typeof vi.fn>;
  let cacheSet: ReturnType<typeof vi.fn>;
  let cacheInvalidate: ReturnType<typeof vi.fn>;
  let promotionFindUnique: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    findMany = vi.fn();
    findUnique = vi.fn();
    create = vi.fn();
    update = vi.fn();
    del = vi.fn();
    promotionFindUnique = vi.fn().mockResolvedValue(null);
    cacheGet = vi.fn().mockResolvedValue(null);
    cacheSet = vi.fn().mockResolvedValue(undefined);
    cacheInvalidate = vi.fn().mockResolvedValue(undefined);

    const prisma = {
      marketingPlacement: { findMany, findUnique, create, update, delete: del },
      promotion: { findUnique: promotionFindUnique },
    } as unknown as PrismaService;

    const cache = {
      get: cacheGet,
      set: cacheSet,
      invalidateAll: cacheInvalidate,
    } as unknown as MarketingPlacementCacheService;

    service = new MarketingPlacementService(prisma, cache);
  });

  describe('resolveActive', () => {
    it('returns cached response when present', async () => {
      const cached = {
        APP_LAUNCH: { popup: undefined, banners: [], promoStrips: [] },
        HOME_HERO: { banners: [], promoStrips: [] },
        STORE_TOP: { banners: [], promoStrips: [] },
        STORE_INLINE: { banners: [], promoStrips: [] },
      };
      cacheGet.mockResolvedValue(cached);

      const result = await service.resolveActive(MarketingPlacementPlatform.WEB);

      expect(result).toBe(cached);
      expect(findMany).not.toHaveBeenCalled();
    });

    it('returns only highest-priority popup per slot', async () => {
      findMany.mockResolvedValue([
        { ...baseRow, id: 'low', priority: 1, title: 'Low' },
        { ...baseRow, id: 'high', priority: 99, title: 'High' },
      ]);

      const result = await service.resolveActive(MarketingPlacementPlatform.WEB);

      expect(result.APP_LAUNCH.popup?.id).toBe('high');
      expect(cacheSet).toHaveBeenCalled();
    });

    it('returns multiple banners ordered by query sort', async () => {
      findMany.mockResolvedValue([
        {
          ...baseRow,
          id: 'b1',
          type: MarketingPlacementType.BANNER,
          slot: MarketingPlacementSlot.HOME_HERO,
          priority: 20,
        },
        {
          ...baseRow,
          id: 'b2',
          type: MarketingPlacementType.BANNER,
          slot: MarketingPlacementSlot.HOME_HERO,
          priority: 10,
        },
      ]);

      const result = await service.resolveActive(MarketingPlacementPlatform.WEB);

      expect(result.HOME_HERO.banners.map((b) => b.id)).toEqual(['b1', 'b2']);
    });

    it('excludes placements outside scheduling window via prisma filter', async () => {
      findMany.mockResolvedValue([]);

      await service.resolveActive(MarketingPlacementPlatform.MOBILE);

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            OR: [{ platform: MarketingPlacementPlatform.MOBILE }, { platform: 'ALL' }],
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('rejects POPUP on non-launch slot', async () => {
      await expect(
        service.create({
          name: 'Bad popup',
          type: MarketingPlacementType.POPUP,
          slot: MarketingPlacementSlot.HOME_HERO,
          title: 'Title',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('invalidates cache after create', async () => {
      create.mockResolvedValue(baseRow);

      await service.create({
        name: 'Launch',
        type: MarketingPlacementType.POPUP,
        slot: MarketingPlacementSlot.APP_LAUNCH,
        title: 'Title',
      });

      expect(cacheInvalidate).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('bumps contentVersion when visual fields change', async () => {
      findUnique.mockResolvedValue(baseRow);
      update.mockResolvedValue({ ...baseRow, title: 'New title', contentVersion: 2 });

      await service.update('p1', { title: 'New title' });

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
          data: expect.objectContaining({ contentVersion: 2, title: 'New title' }),
        }),
      );
      expect(cacheInvalidate).toHaveBeenCalled();
    });

    it('does not bump contentVersion for non-visual fields', async () => {
      findUnique.mockResolvedValue(baseRow);
      update.mockResolvedValue({ ...baseRow, priority: 5 });

      await service.update('p1', { priority: 5 });

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ contentVersion: expect.anything() }),
        }),
      );
    });
  });

  describe('promotionId validation', () => {
    it('rejects unknown promotion', async () => {
      promotionFindUnique.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Promo link',
          type: MarketingPlacementType.BANNER,
          slot: MarketingPlacementSlot.HOME_HERO,
          title: 'Title',
          promotionId: 'missing',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('cache invalidation smoke', () => {
    it('returns newly created banner after cache invalidation', async () => {
      create.mockResolvedValue({
        ...baseRow,
        id: 'banner-new',
        type: MarketingPlacementType.BANNER,
        slot: MarketingPlacementSlot.HOME_HERO,
        platform: MarketingPlacementPlatform.WEB,
        title: 'Fresh banner',
      });

      await service.create({
        name: 'Fresh',
        type: MarketingPlacementType.BANNER,
        slot: MarketingPlacementSlot.HOME_HERO,
        platform: MarketingPlacementPlatform.WEB,
        title: 'Fresh banner',
      });

      expect(cacheInvalidate).toHaveBeenCalled();

      findMany.mockResolvedValue([
        {
          ...baseRow,
          id: 'banner-new',
          type: MarketingPlacementType.BANNER,
          slot: MarketingPlacementSlot.HOME_HERO,
          platform: MarketingPlacementPlatform.WEB,
          title: 'Fresh banner',
        },
      ]);

      const active = await service.resolveActive(MarketingPlacementPlatform.WEB);
      expect(active.HOME_HERO.banners.some((b) => b.id === 'banner-new')).toBe(true);
    });
  });
});
