import type { CartItemInput } from './promotion.service.js';

export interface DiscountRuleEval {
  id: string;
  minimumQuantity: number | null;
  minimumAmount: number | null;
  applicableProductId: string | null;
  applicableCategoryId: string | null;
  discountValue: number | null;
  createdAt: Date;
}

export interface RuleEvalContext {
  items: CartItemInput[];
  categoryByProductId: Map<string, string | null | undefined>;
}

export interface PromotionEvalResult {
  discount: number;
  lineDiscounts: number[];
  freeShipping: boolean;
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

export function isGlobalRule(rule: DiscountRuleEval): boolean {
  return !rule.applicableProductId && !rule.applicableCategoryId;
}

export function isLineEligibleForRule(
  item: CartItemInput,
  rule: DiscountRuleEval,
  ctx: RuleEvalContext,
): boolean {
  const hasProduct = Boolean(rule.applicableProductId);
  const hasCategory = Boolean(rule.applicableCategoryId);
  if (!hasProduct && !hasCategory) {
    return true;
  }

  const productMatch = hasProduct && item.productId === rule.applicableProductId;
  const categoryMatch =
    hasCategory && ctx.categoryByProductId.get(item.productId) === rule.applicableCategoryId;

  if (hasProduct && hasCategory) {
    return productMatch || categoryMatch;
  }
  if (hasProduct) {
    return productMatch;
  }
  return categoryMatch;
}

export function getScopedMetrics(
  rule: DiscountRuleEval,
  ctx: RuleEvalContext,
): { quantity: number; subtotal: number; indices: number[] } {
  let quantity = 0;
  let subtotal = 0;
  const indices: number[] = [];

  ctx.items.forEach((item, index) => {
    if (!isLineEligibleForRule(item, rule, ctx)) {
      return;
    }
    quantity += item.quantity;
    subtotal += item.price * item.quantity;
    indices.push(index);
  });

  return { quantity, subtotal: round2(subtotal), indices };
}

export function requiredQuantityForRule(rule: DiscountRuleEval): number | null {
  if (rule.minimumQuantity != null) {
    return rule.minimumQuantity;
  }
  if (rule.applicableProductId || rule.applicableCategoryId) {
    return 1;
  }
  return null;
}

export function isRuleSatisfied(rule: DiscountRuleEval, ctx: RuleEvalContext): boolean {
  const { quantity, subtotal } = getScopedMetrics(rule, ctx);
  const minQty = requiredQuantityForRule(rule);

  if (minQty !== null && quantity < minQty) {
    return false;
  }
  if (rule.minimumAmount !== null && subtotal < rule.minimumAmount) {
    return false;
  }
  if (
    (rule.applicableProductId || rule.applicableCategoryId) &&
    minQty === null &&
    rule.minimumAmount === null &&
    quantity < 1
  ) {
    return false;
  }
  return true;
}

export function validateGlobalGates(
  rules: DiscountRuleEval[],
  fullSubtotal: number,
  totalQuantity: number,
): string | null {
  for (const rule of rules.filter(isGlobalRule)) {
    if (rule.minimumAmount !== null && fullSubtotal < rule.minimumAmount) {
      return `requires a minimum spend of ${rule.minimumAmount}`;
    }
    if (rule.minimumQuantity !== null && totalQuantity < rule.minimumQuantity) {
      return `requires a minimum quantity of ${rule.minimumQuantity}`;
    }
  }
  return null;
}

function allocateProportionalDiscount(
  items: CartItemInput[],
  eligibleIndices: Set<number>,
  totalDiscount: number,
): number[] {
  const lineDiscounts = items.map(() => 0);
  if (totalDiscount <= 0 || eligibleIndices.size === 0) {
    return lineDiscounts;
  }

  let eligibleSubtotal = 0;
  for (const index of eligibleIndices) {
    eligibleSubtotal += items[index].price * items[index].quantity;
  }
  if (eligibleSubtotal <= 0) {
    return lineDiscounts;
  }

  let remaining = totalDiscount;
  const indices = [...eligibleIndices];
  indices.forEach((index, position) => {
    const lineSubtotal = items[index].price * items[index].quantity;
    const isLast = position === indices.length - 1;
    const lineDiscount = isLast
      ? remaining
      : round2((lineSubtotal / eligibleSubtotal) * totalDiscount);
    lineDiscounts[index] = lineDiscount;
    remaining = round2(remaining - lineDiscount);
  });

  return lineDiscounts;
}

function unionIndicesFromRules(rules: DiscountRuleEval[], ctx: RuleEvalContext): Set<number> {
  const indices = new Set<number>();
  for (const rule of rules) {
    for (const index of getScopedMetrics(rule, ctx).indices) {
      indices.add(index);
    }
  }
  return indices;
}

function emptyLineDiscounts(itemCount: number): number[] {
  return Array.from({ length: itemCount }, () => 0);
}

export function evaluateBundle(
  rules: DiscountRuleEval[],
  promotionValue: number | null,
  ctx: RuleEvalContext,
): PromotionEvalResult | null {
  const scopedRules = rules.filter((rule) => !isGlobalRule(rule));
  for (const rule of scopedRules) {
    if (!isRuleSatisfied(rule, ctx)) {
      return null;
    }
  }

  if (promotionValue === null) {
    return {
      discount: 0,
      lineDiscounts: emptyLineDiscounts(ctx.items.length),
      freeShipping: false,
    };
  }

  const eligibleIndices =
    scopedRules.length > 0
      ? unionIndicesFromRules(scopedRules, ctx)
      : new Set(ctx.items.map((_, index) => index));

  let unionSubtotal = 0;
  for (const index of eligibleIndices) {
    unionSubtotal += ctx.items[index].price * ctx.items[index].quantity;
  }
  unionSubtotal = round2(unionSubtotal);

  const discount = round2((unionSubtotal * promotionValue) / 100);
  return {
    discount,
    lineDiscounts: allocateProportionalDiscount(ctx.items, eligibleIndices, discount),
    freeShipping: false,
  };
}

export function evaluateTiered(
  rules: DiscountRuleEval[],
  promotionValue: number | null,
  ctx: RuleEvalContext,
): PromotionEvalResult | null {
  const scopedRules = rules.filter((rule) => !isGlobalRule(rule));
  const tiers = scopedRules.length > 0 ? scopedRules : rules.filter(isGlobalRule);
  if (tiers.length === 0) {
    return null;
  }

  const sorted = [...tiers].sort((a, b) => {
    const qtyDiff = (b.minimumQuantity ?? 0) - (a.minimumQuantity ?? 0);
    if (qtyDiff !== 0) {
      return qtyDiff;
    }
    const amountDiff = (b.minimumAmount ?? 0) - (a.minimumAmount ?? 0);
    if (amountDiff !== 0) {
      return amountDiff;
    }
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  for (const rule of sorted) {
    if (!isRuleSatisfied(rule, ctx)) {
      continue;
    }

    const rate = rule.discountValue ?? promotionValue;
    const { subtotal, indices } = getScopedMetrics(rule, ctx);
    if (rate === null) {
      return {
        discount: 0,
        lineDiscounts: emptyLineDiscounts(ctx.items.length),
        freeShipping: false,
      };
    }

    const discount = round2((subtotal * rate) / 100);
    return {
      discount,
      lineDiscounts: allocateProportionalDiscount(ctx.items, new Set(indices), discount),
      freeShipping: false,
    };
  }

  return null;
}

export function evaluatePercentage(
  promotionValue: number | null,
  rules: DiscountRuleEval[],
  ctx: RuleEvalContext,
  fullSubtotal: number,
): PromotionEvalResult {
  if (promotionValue === null) {
    return {
      discount: 0,
      lineDiscounts: emptyLineDiscounts(ctx.items.length),
      freeShipping: false,
    };
  }

  const scopedRules = rules.filter((rule) => !isGlobalRule(rule));
  if (scopedRules.length > 0) {
    const eligibleIndices = unionIndicesFromRules(scopedRules, ctx);
    let unionSubtotal = 0;
    for (const index of eligibleIndices) {
      unionSubtotal += ctx.items[index].price * ctx.items[index].quantity;
    }
    unionSubtotal = round2(unionSubtotal);
    const discount = round2((unionSubtotal * promotionValue) / 100);
    return {
      discount,
      lineDiscounts: allocateProportionalDiscount(ctx.items, eligibleIndices, discount),
      freeShipping: false,
    };
  }

  const discount = round2((fullSubtotal * promotionValue) / 100);
  const allIndices = new Set(ctx.items.map((_, index) => index));
  return {
    discount,
    lineDiscounts: allocateProportionalDiscount(ctx.items, allIndices, discount),
    freeShipping: false,
  };
}

export function evaluateFixedAmount(
  promotionValue: number | null,
  rules: DiscountRuleEval[],
  ctx: RuleEvalContext,
  fullSubtotal: number,
): PromotionEvalResult {
  if (promotionValue === null) {
    return {
      discount: 0,
      lineDiscounts: emptyLineDiscounts(ctx.items.length),
      freeShipping: false,
    };
  }

  const scopedRules = rules.filter((rule) => !isGlobalRule(rule));
  const baseSubtotal =
    scopedRules.length > 0
      ? round2(
          [...unionIndicesFromRules(scopedRules, ctx)].reduce(
            (sum, index) => sum + ctx.items[index].price * ctx.items[index].quantity,
            0,
          ),
        )
      : fullSubtotal;

  const discount = Math.min(round2(promotionValue), baseSubtotal);
  const eligibleIndices =
    scopedRules.length > 0
      ? unionIndicesFromRules(scopedRules, ctx)
      : new Set(ctx.items.map((_, index) => index));

  return {
    discount,
    lineDiscounts: allocateProportionalDiscount(ctx.items, eligibleIndices, discount),
    freeShipping: false,
  };
}

export function bundleValidationError(
  rules: DiscountRuleEval[],
  ctx: RuleEvalContext,
  couponCode: string,
): string | null {
  for (const rule of rules.filter((item) => !isGlobalRule(item))) {
    if (isRuleSatisfied(rule, ctx)) {
      continue;
    }
    const minQty = requiredQuantityForRule(rule);
    const { quantity, subtotal } = getScopedMetrics(rule, ctx);
    if (rule.applicableProductId && minQty !== null && quantity < minQty) {
      return `Coupon ${couponCode} requires at least ${minQty} unit(s) of the bundle product`;
    }
    if (rule.applicableCategoryId && minQty !== null && quantity < minQty) {
      return `Coupon ${couponCode} requires at least ${minQty} unit(s) from the bundle category`;
    }
    if (rule.minimumAmount !== null && subtotal < rule.minimumAmount) {
      return `Coupon ${couponCode} requires a minimum spend of ${rule.minimumAmount} on bundle items`;
    }
    return `Coupon ${couponCode} does not satisfy all bundle requirements`;
  }
  return null;
}
