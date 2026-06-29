import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MarketingPlacementPlatform,
  MarketingPlacementSlot,
  MarketingPlacementType,
  Prisma,
} from '@prisma/client';
import type {
  ActivePlacementsResponse,
  MarketingPlacementPublic,
  SlotActivePlacements,
} from '@repo/shared-types';
import { PrismaService } from '../prisma/prisma.service.js';
import { MarketingPlacementCacheService } from './marketing-placement-cache.service.js';
import {
  AdminMarketingPlacementsQueryDto,
  CreateMarketingPlacementDto,
  UpdateMarketingPlacementDto,
} from './dto/marketing-placement.dto.js';

const ALL_SLOTS: MarketingPlacementSlot[] = [
  MarketingPlacementSlot.APP_LAUNCH,
  MarketingPlacementSlot.HOME_HERO,
  MarketingPlacementSlot.STORE_TOP,
  MarketingPlacementSlot.STORE_INLINE,
];

const MOBILE_CTA_PREFIXES = ['/(tabs)/', '/product/', '/store'] as const;

const VISUAL_FIELDS = ['title', 'body', 'imageUrl', 'ctaLabel', 'ctaHref'] as const;

function emptySlotPlacements(): SlotActivePlacements {
  return { banners: [], promoStrips: [] };
}

function emptyActiveResponse(): ActivePlacementsResponse {
  return {
    APP_LAUNCH: emptySlotPlacements(),
    HOME_HERO: emptySlotPlacements(),
    STORE_TOP: emptySlotPlacements(),
    STORE_INLINE: emptySlotPlacements(),
  };
}

@Injectable()
export class MarketingPlacementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: MarketingPlacementCacheService,
  ) {}

  findAllAdmin(query: AdminMarketingPlacementsQueryDto) {
    const where: Prisma.MarketingPlacementWhereInput = {};
    if (query.type !== undefined) {
      where.type = query.type;
    }
    if (query.slot !== undefined) {
      where.slot = query.slot;
    }
    if (query.platform !== undefined) {
      where.platform = query.platform;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return this.prisma.marketingPlacement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async findById(id: string) {
    const placement = await this.prisma.marketingPlacement.findUnique({ where: { id } });
    if (!placement) {
      throw new NotFoundException(`Marketing placement ${id} not found`);
    }
    return placement;
  }

  async create(dto: CreateMarketingPlacementDto) {
    const platform = dto.platform ?? MarketingPlacementPlatform.ALL;
    await this.validateBusinessRules({ ...dto, platform });
    const placement = await this.prisma.marketingPlacement.create({
      data: this.toCreateData(dto),
    });
    await this.cache.invalidateAll();
    return placement;
  }

  async update(id: string, dto: UpdateMarketingPlacementDto) {
    const existing = await this.findById(id);
    const merged = {
      type: dto.type ?? existing.type,
      slot: dto.slot ?? existing.slot,
      platform: dto.platform ?? existing.platform,
      ctaHref: dto.ctaHref !== undefined ? dto.ctaHref : existing.ctaHref,
      promotionId: dto.promotionId !== undefined ? dto.promotionId : existing.promotionId,
    };
    await this.validateBusinessRules(merged);

    const bumpVersion = VISUAL_FIELDS.some((field) => {
      if (!(field in dto)) {
        return false;
      }
      const next = dto[field as keyof UpdateMarketingPlacementDto];
      const prev = existing[field as keyof typeof existing];
      return next !== prev;
    });

    const placement = await this.prisma.marketingPlacement.update({
      where: { id },
      data: {
        ...this.toUpdateData(dto),
        ...(bumpVersion ? { contentVersion: existing.contentVersion + 1 } : {}),
      },
    });
    await this.cache.invalidateAll();
    return placement;
  }

  async remove(id: string) {
    await this.findById(id);
    const placement = await this.prisma.marketingPlacement.delete({ where: { id } });
    await this.cache.invalidateAll();
    return placement;
  }

  async resolveActive(platform: 'WEB' | 'MOBILE'): Promise<ActivePlacementsResponse> {
    const cached = await this.cache.get(platform);
    if (cached) {
      return cached;
    }

    const now = new Date();
    const rows = await this.prisma.marketingPlacement.findMany({
      where: {
        isActive: true,
        OR: [{ platform }, { platform: MarketingPlacementPlatform.ALL }],
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        ],
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    });

    const response = this.groupActivePlacements(rows);
    await this.cache.set(platform, response);
    return response;
  }

  private groupActivePlacements(
    rows: Array<{
      id: string;
      type: MarketingPlacementType;
      slot: MarketingPlacementSlot;
      title: string;
      body: string | null;
      imageUrl: string | null;
      ctaLabel: string | null;
      ctaHref: string | null;
      promotionId: string | null;
      priority: number;
      contentVersion: number;
      showOncePerSession: boolean;
      showOnceEver: boolean;
      dismissible: boolean;
    }>,
  ): ActivePlacementsResponse {
    const response = emptyActiveResponse();

    for (const slot of ALL_SLOTS) {
      const slotRows = rows
        .filter((row) => row.slot === slot)
        .sort((a, b) => b.priority - a.priority || 0);
      const slotBucket = response[slot];

      for (const row of slotRows) {
        const publicRow = this.toPublic(row);
        if (row.type === MarketingPlacementType.POPUP) {
          if (!slotBucket.popup) {
            slotBucket.popup = publicRow;
          }
          continue;
        }
        if (row.type === MarketingPlacementType.BANNER) {
          slotBucket.banners.push(publicRow);
          continue;
        }
        slotBucket.promoStrips.push(publicRow);
      }
    }

    return response;
  }

  private toPublic(row: {
    id: string;
    type: MarketingPlacementType;
    slot: MarketingPlacementSlot;
    title: string;
    body: string | null;
    imageUrl: string | null;
    ctaLabel: string | null;
    ctaHref: string | null;
    promotionId: string | null;
    priority: number;
    contentVersion: number;
    showOncePerSession: boolean;
    showOnceEver: boolean;
    dismissible: boolean;
  }): MarketingPlacementPublic {
    return {
      id: row.id,
      type: row.type,
      slot: row.slot,
      title: row.title,
      body: row.body,
      imageUrl: row.imageUrl,
      ctaLabel: row.ctaLabel,
      ctaHref: row.ctaHref,
      promotionId: row.promotionId,
      priority: row.priority,
      contentVersion: row.contentVersion,
      showOncePerSession: row.showOncePerSession,
      showOnceEver: row.showOnceEver,
      dismissible: row.dismissible,
    };
  }

  private async validateBusinessRules(input: {
    type: MarketingPlacementType;
    slot: MarketingPlacementSlot;
    platform: MarketingPlacementPlatform;
    ctaHref?: string | null;
    promotionId?: string | null;
  }) {
    if (input.type === MarketingPlacementType.POPUP && input.slot !== MarketingPlacementSlot.APP_LAUNCH) {
      throw new BadRequestException('POPUP must use APP_LAUNCH slot');
    }
    if (input.type !== MarketingPlacementType.POPUP && input.slot === MarketingPlacementSlot.APP_LAUNCH) {
      throw new BadRequestException('BANNER and PROMO_STRIP cannot use APP_LAUNCH slot');
    }

    if (input.platform === MarketingPlacementPlatform.MOBILE && input.ctaHref) {
      const allowed = MOBILE_CTA_PREFIXES.some((prefix) => input.ctaHref!.startsWith(prefix));
      if (!allowed) {
        throw new BadRequestException(
          'Mobile ctaHref must start with /(tabs)/, /product/, or /store',
        );
      }
    }

    if (input.promotionId) {
      const promotion = await this.prisma.promotion.findUnique({
        where: { id: input.promotionId },
      });
      if (!promotion) {
        throw new NotFoundException(`Promotion ${input.promotionId} not found`);
      }
      if (!promotion.isActive) {
        throw new BadRequestException('Linked promotion must be active');
      }
    }
  }

  private toCreateData(dto: CreateMarketingPlacementDto): Prisma.MarketingPlacementCreateInput {
    return {
      name: dto.name,
      type: dto.type,
      slot: dto.slot,
      platform: dto.platform ?? MarketingPlacementPlatform.ALL,
      title: dto.title,
      body: dto.body,
      imageUrl: dto.imageUrl,
      ctaLabel: dto.ctaLabel,
      ctaHref: dto.ctaHref,
      promotion: dto.promotionId ? { connect: { id: dto.promotionId } } : undefined,
      priority: dto.priority ?? 0,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      isActive: dto.isActive ?? true,
      showOncePerSession: dto.showOncePerSession ?? false,
      showOnceEver: dto.showOnceEver ?? false,
      dismissible: dto.dismissible ?? true,
    };
  }

  private toUpdateData(dto: UpdateMarketingPlacementDto): Prisma.MarketingPlacementUpdateInput {
    const data: Prisma.MarketingPlacementUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.slot !== undefined) data.slot = dto.slot;
    if (dto.platform !== undefined) data.platform = dto.platform;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.body !== undefined) data.body = dto.body;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.ctaLabel !== undefined) data.ctaLabel = dto.ctaLabel;
    if (dto.ctaHref !== undefined) data.ctaHref = dto.ctaHref;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.startsAt !== undefined) data.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.endsAt !== undefined) data.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.showOncePerSession !== undefined) data.showOncePerSession = dto.showOncePerSession;
    if (dto.showOnceEver !== undefined) data.showOnceEver = dto.showOnceEver;
    if (dto.dismissible !== undefined) data.dismissible = dto.dismissible;

    if (dto.promotionId !== undefined) {
      data.promotion =
        dto.promotionId === null
          ? { disconnect: true }
          : { connect: { id: dto.promotionId } };
    }

    return data;
  }
}
