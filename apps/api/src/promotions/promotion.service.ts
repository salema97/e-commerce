import {

  Injectable,

  BadRequestException,

  NotFoundException,

  Logger,

} from '@nestjs/common';

import { Prisma, PromotionType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';

import { TaxService } from '../tax/tax.service.js';

import {

  bundleValidationError,

  evaluateBundle,

  evaluateFixedAmount,

  evaluatePercentage,

  evaluateTiered,

  isGlobalRule,

  isRuleSatisfied,

  type DiscountRuleEval,

  type RuleEvalContext,

  validateGlobalGates,

} from './promotion-rule-evaluator.js';



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

  lineDiscounts: number[];

}



const DECIMAL_PRECISION = 2;



function round2(value: number): number {

  return Number(value.toFixed(DECIMAL_PRECISION));

}



type CouponWithPromotion = {

  id: string;

  code: string;

  usageLimit: number | null;

  usageCount: number;

  isActive: boolean;

  promotion: {

    id: string;

    name: string;

    type: PromotionType;

    value: Prisma.Decimal | null;

    startsAt: Date | null;

    endsAt: Date | null;

    isActive: boolean;

    discountRules: Array<{

      id: string;

      minimumQuantity: number | null;

      minimumAmount: Prisma.Decimal | null;

      applicableProductId: string | null;

      applicableCategoryId: string | null;

      discountValue: Prisma.Decimal | null;

      createdAt: Date;

    }>;

  };

};



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
    coupon: CouponWithPromotion;
    subtotal: number;
  }> {

    const coupon = await this.loadCoupon(code);

    this.assertCouponLifecycle(coupon, code);



    const subtotal = this.computeSubtotal(cartItems);

    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const rules = this.toRuleEvals(coupon.promotion.discountRules);

    const ctx = await this.buildRuleContext(cartItems);



    const globalError = validateGlobalGates(rules, subtotal, totalQuantity);

    if (globalError) {

      throw new BadRequestException(`Coupon ${code} ${globalError}`);

    }



    this.assertTypeSpecificEligibility(coupon.promotion.type, rules, ctx, code);



    for (const rule of rules.filter((item) => !isGlobalRule(item))) {

      if (coupon.promotion.type === PromotionType.BUNDLE) {

        continue;

      }

      if (coupon.promotion.type === PromotionType.TIERED) {

        continue;

      }

      if (!isRuleSatisfied(rule, ctx)) {

        throw new BadRequestException(

          `Coupon ${code} does not meet the promotion requirements for this cart`,

        );

      }

    }



    return { coupon, subtotal };

  }



  async applyPromotion(

    code: string,

    orderItems: CartItemInput[],

  ): Promise<AppliedPromotion> {

    const { coupon } = await this.validateCoupon(code, orderItems);

    const promotion = coupon.promotion;

    const rules = this.toRuleEvals(promotion.discountRules);

    const ctx = await this.buildRuleContext(orderItems);

    const subtotal = this.computeSubtotal(orderItems);

    const promotionValue = promotion.value !== null ? Number(promotion.value) : null;



    let result;

    switch (promotion.type) {

      case PromotionType.PERCENTAGE:

        result = evaluatePercentage(promotionValue, rules, ctx, subtotal);

        break;

      case PromotionType.FIXED_AMOUNT:

        result = evaluateFixedAmount(promotionValue, rules, ctx, subtotal);

        break;

      case PromotionType.FREE_SHIPPING:

        result = {

          discount: 0,

          lineDiscounts: orderItems.map(() => 0),

          freeShipping: true,

        };

        break;

      case PromotionType.BUNDLE: {

        const bundleResult = evaluateBundle(rules, promotionValue, ctx);

        if (!bundleResult) {

          throw new BadRequestException(`Coupon ${code} does not satisfy all bundle requirements`);

        }

        result = bundleResult;

        break;

      }

      case PromotionType.TIERED: {

        const tieredResult = evaluateTiered(rules, promotionValue, ctx);

        if (!tieredResult) {

          throw new BadRequestException(`Coupon ${code} does not match any promotion tier`);

        }

        result = tieredResult;

        break;

      }

      default:

        result = {

          discount: 0,

          lineDiscounts: orderItems.map(() => 0),

          freeShipping: false,

        };

    }



    return {

      promotionId: promotion.id,

      couponCode: coupon.code,

      discount: result.discount,

      type: promotion.type,

      freeShipping: result.freeShipping,

      lineDiscounts: result.lineDiscounts,

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

    lineDiscounts?: number[];

  }> {

    const subtotal = this.computeSubtotal(items);



    let discount = 0;

    let promotionId: string | undefined;

    let freeShipping = false;

    let lineDiscounts: number[] | undefined;



    if (couponCode) {

      const applied = await this.applyPromotion(couponCode, items);

      discount = applied.discount;

      promotionId = applied.promotionId;

      freeShipping = applied.freeShipping;

      lineDiscounts = applied.lineDiscounts;

    }



    return {

      subtotal: round2(subtotal),

      discount: round2(discount),

      freeShipping,

      couponCode,

      promotionId,

      lineDiscounts,

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

    return round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0));

  }



  private async loadCoupon(code: string): Promise<CouponWithPromotion> {

    const coupon = await this.prisma.coupon.findUnique({

      where: { code },

      include: {

        promotion: {

          include: { discountRules: { orderBy: { createdAt: 'asc' } } },

        },

      },

    });



    if (!coupon) {

      throw new NotFoundException(`Coupon ${code} not found`);

    }



    return coupon;

  }



  private assertCouponLifecycle(coupon: CouponWithPromotion, code: string): void {

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

  }



  private async buildRuleContext(items: CartItemInput[]): Promise<RuleEvalContext> {

    const productIds = [...new Set(items.map((item) => item.productId))];

    const products = productIds.length

      ? await this.prisma.product.findMany({

          where: { id: { in: productIds } },

          select: { id: true, categoryId: true },

        })

      : [];



    return {

      items,

      categoryByProductId: new Map(products.map((product) => [product.id, product.categoryId])),

    };

  }



  private toRuleEvals(

    rules: CouponWithPromotion['promotion']['discountRules'],

  ): DiscountRuleEval[] {

    return rules.map((rule) => ({

      id: rule.id,

      minimumQuantity: rule.minimumQuantity,

      minimumAmount: rule.minimumAmount !== null ? Number(rule.minimumAmount) : null,

      applicableProductId: rule.applicableProductId,

      applicableCategoryId: rule.applicableCategoryId,

      discountValue: rule.discountValue !== null ? Number(rule.discountValue) : null,

      createdAt: rule.createdAt,

    }));

  }



  private assertTypeSpecificEligibility(

    type: PromotionType,

    rules: DiscountRuleEval[],

    ctx: RuleEvalContext,

    couponCode: string,

  ): void {

    if (type === PromotionType.BUNDLE) {

      const scopedRules = rules.filter((rule) => !isGlobalRule(rule));

      if (scopedRules.length === 0) {

        throw new BadRequestException(`Coupon ${couponCode} bundle promotion has no bundle rules`);

      }

      const bundleError = bundleValidationError(rules, ctx, couponCode);

      if (bundleError) {

        throw new BadRequestException(bundleError);

      }

      return;

    }



    if (type === PromotionType.TIERED) {

      if (rules.length === 0) {

        throw new BadRequestException(`Coupon ${couponCode} tiered promotion has no tiers`);

      }

      const hasTier = rules.some((rule) => isRuleSatisfied(rule, ctx));

      if (!hasTier) {

        throw new BadRequestException(`Coupon ${couponCode} does not match any promotion tier`);

      }

    }

  }

}


