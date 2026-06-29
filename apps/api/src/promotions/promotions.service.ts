import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PromotionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePromotionDto } from './dto/create-promotion.dto.js';
import { UpdatePromotionDto } from './dto/update-promotion.dto.js';
import { PromotionsQueryDto } from './dto/promotions-query.dto.js';
import {
  CreatePromotionCouponDto,
  UpdatePromotionCouponDto,
} from './dto/promotion-coupon.dto.js';
import {
  CreatePromotionDiscountRuleDto,
  UpdatePromotionDiscountRuleDto,
} from './dto/promotion-discount-rule.dto.js';

const VALUE_REQUIRED_TYPES: PromotionType[] = [
  PromotionType.PERCENTAGE,
  PromotionType.FIXED_AMOUNT,
  PromotionType.BUNDLE,
];

const RULE_REQUIRED_TYPES: PromotionType[] = [PromotionType.BUNDLE, PromotionType.TIERED];

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: PromotionsQueryDto) {
    const where: Prisma.PromotionWhereInput = {};
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.type !== undefined) {
      where.type = query.type;
    }

    return this.prisma.promotion.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        _count: { select: { coupons: true, discountRules: true } },
      },
    });
  }

  async findOne(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        coupons: { orderBy: { code: 'asc' } },
        discountRules: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!promotion) {
      throw new NotFoundException(`Promotion ${id} not found`);
    }
    return promotion;
  }

  async create(dto: CreatePromotionDto) {
    this.validatePromotionFields(dto.type, dto.value, dto.startsAt, dto.endsAt);

    return this.prisma.promotion.create({
      data: {
        name: dto.name,
        type: dto.type,
        value: dto.value,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdatePromotionDto) {
    const existing = await this.findOne(id);
    const type = dto.type ?? existing.type;
    const value = dto.value !== undefined ? dto.value : existing.value;
    const startsAt =
      dto.startsAt !== undefined ? dto.startsAt : existing.startsAt?.toISOString();
    const endsAt = dto.endsAt !== undefined ? dto.endsAt : existing.endsAt?.toISOString();

    this.validatePromotionFields(
      type,
      value !== null ? Number(value) : null,
      startsAt ?? undefined,
      endsAt ?? undefined,
    );

    return this.prisma.promotion.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.value !== undefined ? { value: dto.value } : {}),
        ...(dto.startsAt !== undefined
          ? { startsAt: dto.startsAt ? new Date(dto.startsAt) : null }
          : {}),
        ...(dto.endsAt !== undefined
          ? { endsAt: dto.endsAt ? new Date(dto.endsAt) : null }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.promotion.delete({ where: { id } });
  }

  async createCoupon(promotionId: string, dto: CreatePromotionCouponDto) {
    await this.findOne(promotionId);
    const code = this.normalizeCouponCode(dto.code);
    await this.assertCouponCodeAvailable(code);

    return this.prisma.coupon.create({
      data: {
        code,
        promotionId,
        usageLimit: dto.usageLimit,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateCoupon(couponId: string, dto: UpdatePromotionCouponDto) {
    const existing = await this.findCouponById(couponId);

    if (dto.code !== undefined) {
      const code = this.normalizeCouponCode(dto.code);
      if (code !== existing.code) {
        await this.assertCouponCodeAvailable(code, couponId);
      }
    }

    return this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        ...(dto.code !== undefined ? { code: this.normalizeCouponCode(dto.code) } : {}),
        ...(dto.usageLimit !== undefined ? { usageLimit: dto.usageLimit } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async removeCoupon(couponId: string) {
    await this.findCouponById(couponId);
    return this.prisma.coupon.delete({ where: { id: couponId } });
  }

  async createDiscountRule(promotionId: string, dto: CreatePromotionDiscountRuleDto) {
    const promotion = await this.findOne(promotionId);
    this.assertDiscountRuleHasConstraint(dto);
    this.validateDiscountRuleFields(promotion.type, dto.discountValue);

    return this.prisma.discountRule.create({
      data: {
        promotionId,
        minimumQuantity: dto.minimumQuantity,
        minimumAmount: dto.minimumAmount,
        applicableProductId: dto.applicableProductId,
        applicableCategoryId: dto.applicableCategoryId,
        discountValue: dto.discountValue,
      },
    });
  }

  async updateDiscountRule(ruleId: string, dto: UpdatePromotionDiscountRuleDto) {
    const existing = await this.findDiscountRuleById(ruleId);
    const promotion = await this.findOne(existing.promotionId);
    const merged = {
      minimumQuantity:
        dto.minimumQuantity !== undefined ? dto.minimumQuantity : existing.minimumQuantity,
      minimumAmount:
        dto.minimumAmount !== undefined
          ? dto.minimumAmount
          : existing.minimumAmount != null
            ? Number(existing.minimumAmount)
            : existing.minimumAmount,
      applicableProductId:
        dto.applicableProductId !== undefined
          ? dto.applicableProductId
          : existing.applicableProductId,
      applicableCategoryId:
        dto.applicableCategoryId !== undefined
          ? dto.applicableCategoryId
          : existing.applicableCategoryId,
      discountValue:
        dto.discountValue !== undefined
          ? dto.discountValue
          : existing.discountValue != null
            ? Number(existing.discountValue)
            : existing.discountValue,
    };
    this.assertDiscountRuleHasConstraint(merged);
    this.validateDiscountRuleFields(promotion.type, merged.discountValue);

    return this.prisma.discountRule.update({
      where: { id: ruleId },
      data: {
        ...(dto.minimumQuantity !== undefined ? { minimumQuantity: dto.minimumQuantity } : {}),
        ...(dto.minimumAmount !== undefined ? { minimumAmount: dto.minimumAmount } : {}),
        ...(dto.applicableProductId !== undefined
          ? { applicableProductId: dto.applicableProductId }
          : {}),
        ...(dto.applicableCategoryId !== undefined
          ? { applicableCategoryId: dto.applicableCategoryId }
          : {}),
        ...(dto.discountValue !== undefined ? { discountValue: dto.discountValue } : {}),
      },
    });
  }

  async removeDiscountRule(ruleId: string) {
    await this.findDiscountRuleById(ruleId);
    return this.prisma.discountRule.delete({ where: { id: ruleId } });
  }

  private normalizeCouponCode(code: string): string {
    return code.trim().toUpperCase();
  }

  private async assertCouponCodeAvailable(code: string, excludeId?: string) {
    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Coupon code ${code} is already in use`);
    }
  }

  private async findCouponById(couponId: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) {
      throw new NotFoundException(`Coupon ${couponId} not found`);
    }
    return coupon;
  }

  private async findDiscountRuleById(ruleId: string) {
    const rule = await this.prisma.discountRule.findUnique({ where: { id: ruleId } });
    if (!rule) {
      throw new NotFoundException(`Discount rule ${ruleId} not found`);
    }
    return rule;
  }

  private assertDiscountRuleHasConstraint(rule: {
    minimumQuantity?: number | null;
    minimumAmount?: number | null;
    applicableProductId?: string | null;
    applicableCategoryId?: string | null;
  }) {
    const hasConstraint =
      rule.minimumQuantity != null ||
      rule.minimumAmount != null ||
      rule.applicableProductId != null ||
      rule.applicableCategoryId != null;
    if (!hasConstraint) {
      throw new BadRequestException(
        'Discount rule requires at least one of minimumQuantity, minimumAmount, applicableProductId, or applicableCategoryId',
      );
    }
  }

  private validatePromotionFields(
    type: PromotionType,
    value: number | null | undefined,
    startsAt?: string,
    endsAt?: string,
  ) {
    if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    if (VALUE_REQUIRED_TYPES.includes(type) && (value === undefined || value === null)) {
      throw new BadRequestException(`Promotion type ${type} requires a value`);
    }
  }

  private validateDiscountRuleFields(
    promotionType: PromotionType,
    discountValue?: number | null,
  ) {
    if (promotionType !== PromotionType.TIERED || discountValue == null) {
      return;
    }
    if (discountValue < 0 || discountValue > 100) {
      throw new BadRequestException('Tier discountValue must be between 0 and 100');
    }
  }

  async assertPromotionHasRules(promotionId: string) {
    const promotion = await this.findOne(promotionId);
    if (!RULE_REQUIRED_TYPES.includes(promotion.type)) {
      return promotion;
    }
    if ((promotion.discountRules?.length ?? 0) === 0) {
      throw new BadRequestException(
        `Promotion type ${promotion.type} requires at least one discount rule`,
      );
    }
    return promotion;
  }
}
