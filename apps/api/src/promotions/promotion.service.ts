import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Prisma, PromotionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { TaxService } from '../tax/tax.service.js';

export interface CartItemInput {
  productId: string;
  variantId?: string;
  price: number;
  quantity: number;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  taxAmount: number;
  shipping: number;
  total: number;
  couponCode?: string;
  promotionId?: string;
}

export interface AppliedPromotion {
  promotionId: string;
  couponCode: string;
  discount: number;
  type: PromotionType;
  freeShipping: boolean;
}

const DECIMAL_PRECISION = 2;

function round2(value: number): number {
  return Number(value.toFixed(DECIMAL_PRECISION));
}

@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly taxService: TaxService,
  ) {}

  async validateCoupon(
    code: string,
    cartItems: CartItemInput[],
  ): Promise<{
    coupon: {
      id: string;
      code: string;
      usageLimit: number | null;
      usageCount: number;
      isActive: boolean;
      promotion: {
        id: string;
        type: PromotionType;
        value: Prisma.Decimal | null;
        startsAt: Date | null;
        endsAt: Date | null;
        isActive: boolean;
        discountRules: Array<{
          id: string;
          minimumQuantity: number | null;
          minimumAmount: Prisma.Decimal | null;
        }>;
      };
    };
    subtotal: number;
  }> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
      include: {
        promotion: {
          include: { discountRules: true },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon ${code} not found`);
    }

    if (!coupon.isActive) {
      throw new BadRequestException(`Coupon ${code} is no longer active`);
    }

    const promotion = coupon.promotion;
    if (!promotion.isActive) {
      throw new BadRequestException(`Promotion ${promotion.name} is no longer active`);
    }

    const now = new Date();
    if (promotion.startsAt && now < promotion.startsAt) {
      throw new BadRequestException(`Coupon ${code} is not yet valid`);
    }
    if (promotion.endsAt && now > promotion.endsAt) {
      throw new BadRequestException(`Coupon ${code} has expired`);
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException(`Coupon ${code} has reached its usage limit`);
    }

    const subtotal = this.computeSubtotal(cartItems);

    for (const rule of promotion.discountRules) {
      if (rule.minimumAmount !== null && subtotal < Number(rule.minimumAmount)) {
        throw new BadRequestException(
          `Coupon ${code} requires a minimum spend of ${rule.minimumAmount}`,
        );
      }
      if (rule.minimumQuantity !== null) {
        const totalQty = cartItems.reduce((sum, i) => sum + i.quantity, 0);
        if (totalQty < rule.minimumQuantity) {
          throw new BadRequestException(
            `Coupon ${code} requires a minimum quantity of ${rule.minimumQuantity}`,
          );
        }
      }
    }

    return { coupon, subtotal };
  }

  async applyPromotion(
    code: string,
    orderItems: CartItemInput[],
  ): Promise<AppliedPromotion> {
    const { coupon, subtotal } = await this.validateCoupon(code, orderItems);
    const promotion = coupon.promotion;

    let discount = 0;
    let freeShipping = false;

    switch (promotion.type) {
      case PromotionType.PERCENTAGE:
        if (promotion.value !== null) {
          discount = round2((subtotal * Number(promotion.value)) / 100);
        }
        break;
      case PromotionType.FIXED_AMOUNT:
        if (promotion.value !== null) {
          discount = Math.min(round2(Number(promotion.value)), subtotal);
        }
        break;
      case PromotionType.FREE_SHIPPING:
        freeShipping = true;
        break;
      case PromotionType.BUNDLE:
      case PromotionType.TIERED:
        // Simplified: treat as percentage if value present; full tier/bundle logic deferred.
        if (promotion.value !== null) {
          discount = round2((subtotal * Number(promotion.value)) / 100);
        }
        break;
    }

    return {
      promotionId: promotion.id,
      couponCode: coupon.code,
      discount,
      type: promotion.type,
      freeShipping,
    };
  }

  async calculateOrderTotals(
    items: CartItemInput[],
    couponCode?: string,
  ): Promise<OrderTotals> {
    const discountTotals = await this.computeDiscountTotals(items, couponCode);
    const taxableAmount = Math.max(0, discountTotals.subtotal - discountTotals.discount);
    const taxAmount = this.taxService.calculateStandardSubtotalTax(taxableAmount);
    const shipping = 0;
    const total = round2(
      discountTotals.subtotal - discountTotals.discount + taxAmount + shipping,
    );

    return {
      subtotal: discountTotals.subtotal,
      discount: discountTotals.discount,
      taxAmount,
      shipping,
      total,
      couponCode: discountTotals.couponCode,
      promotionId: discountTotals.promotionId,
    };
  }

  async computeDiscountTotals(
    items: CartItemInput[],
    couponCode?: string,
  ): Promise<{
    subtotal: number;
    discount: number;
    freeShipping: boolean;
    couponCode?: string;
    promotionId?: string;
  }> {
    const subtotal = this.computeSubtotal(items);

    let discount = 0;
    let promotionId: string | undefined;
    let freeShipping = false;

    if (couponCode) {
      const applied = await this.applyPromotion(couponCode, items);
      discount = applied.discount;
      promotionId = applied.promotionId;
      freeShipping = applied.freeShipping;
    }

    return {
      subtotal: round2(subtotal),
      discount: round2(discount),
      freeShipping,
      couponCode,
      promotionId,
    };
  }

  async incrementCouponUsage(couponCode: string): Promise<void> {
    try {
      await this.prisma.coupon.update({
        where: { code: couponCode },
        data: { usageCount: { increment: 1 } },
      });
    } catch (error) {
      this.logger.warn(
        { error, couponCode },
        'Failed to increment coupon usage counter',
      );
    }
  }

  private computeSubtotal(items: CartItemInput[]): number {
    return round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  }
}
