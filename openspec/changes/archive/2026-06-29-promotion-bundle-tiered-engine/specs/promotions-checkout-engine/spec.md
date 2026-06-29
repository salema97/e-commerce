# Promotions Checkout Engine Specification

## Purpose

Define checkout behavior for `BUNDLE` and `TIERED` promotion types: scoped rule evaluation, discount calculation, and per-line allocation during order creation.

## Requirements

### Requirement: Scoped rule eligibility

The checkout engine MUST resolve `applicableProductId` and `applicableCategoryId` by looking up each cart line's product category. A line is eligible for a rule when it matches the rule's product and/or category constraints. Rules with neither scope apply to the full cart. Scoped subtotal SHALL be the sum of `price × quantity` for eligible lines only.

#### Scenario: Category-scoped rule filters cart lines

- GIVEN a promotion rule with `applicableCategoryId` set to electronics
- AND the cart contains one electronics line ($80) and one apparel line ($40)
- WHEN the engine evaluates the rule
- THEN only the electronics line contributes to the scoped subtotal ($80)

#### Scenario: Product-scoped quantity gate

- GIVEN a BUNDLE rule requiring `applicableProductId` P with `minimumQuantity` 2
- AND the cart has one unit of P and three units of another product
- WHEN `validateCoupon` runs
- THEN the coupon is rejected with an error identifying the missing product quantity

### Requirement: Global cart-wide rule gates

Discount rules with no `applicableProductId` and no `applicableCategoryId` MUST be evaluated against the full-cart subtotal and total quantity before type-specific logic runs.

#### Scenario: Minimum spend on full cart

- GIVEN a promotion with a rule `{ minimumAmount: 50 }` and no scope fields
- AND the cart subtotal is $45
- WHEN `validateCoupon` runs
- THEN the coupon is rejected for insufficient spend

### Requirement: BUNDLE promotion evaluation

For `PromotionType.BUNDLE`, every discount rule MUST be satisfied (logical AND). When `minimumQuantity` is omitted but a product or category is set, the engine MUST treat the required quantity as 1. When all rules pass and `promotion.value` is set, the engine MUST apply that value as a percentage discount on the union of all eligible line subtotals (each line counted once even if matched by multiple rules). If any rule fails, the coupon MUST be rejected. BUNDLE promotions MUST NOT apply a discount when `promotion.value` is null.

#### Scenario: Multi-component bundle satisfied

- GIVEN a BUNDLE promotion with `value` 10 and rules: (product A qty ≥ 1) AND (category electronics qty ≥ 2)
- AND the cart has product A × 1 and two electronics products
- WHEN `applyPromotion` runs
- THEN the discount equals 10% of the union scoped subtotal

#### Scenario: Bundle component missing

- GIVEN a BUNDLE with two scoped rules and only one is satisfied
- WHEN `validateCoupon` runs
- THEN the coupon is rejected before any discount is calculated

### Requirement: TIERED promotion evaluation

For `PromotionType.TIERED`, the engine MUST select the single best matching tier: rules sorted by threshold descending (`minimumQuantity`, then `minimumAmount`), first match wins. Thresholds MUST be evaluated on each rule's eligible scope. The discount rate MUST be `rule.discountValue ?? promotion.value` applied as a percentage on that tier's scoped subtotal. At least one tier MUST match; otherwise the coupon MUST be rejected.

#### Scenario: Highest tier wins with per-tier rate

- GIVEN a TIERED promotion with tiers: qty ≥ 10 → 15%, qty ≥ 5 → 10% (scoped to same category)
- AND the cart has 12 eligible units
- WHEN `applyPromotion` runs
- THEN the discount is 15% of the eligible scoped subtotal

#### Scenario: Tier rate falls back to promotion value

- GIVEN a TIERED rule with threshold met and `discountValue` null
- AND `promotion.value` is 8
- WHEN `applyPromotion` runs
- THEN the discount is 8% of the tier scoped subtotal

### Requirement: Per-line discount allocation

When a promotion discount applies to a subset of cart lines, the engine MUST return per-line discount amounts limited to eligible lines. Order creation and tax calculation MUST use those line amounts; discounts MUST NOT be spread proportionally across ineligible lines.

#### Scenario: Scoped discount does not leak to other SKUs

- GIVEN a category-scoped 10% discount on a $50 eligible line and a $50 ineligible line
- WHEN an order is created with the coupon
- THEN the eligible line carries ~$5 discount and the ineligible line carries $0 discount

### Requirement: Validation and application parity

`validateCoupon` and `applyPromotion` MUST use shared rule-evaluation logic. A coupon that fails validation MUST NOT produce a non-zero discount. Existing `PERCENTAGE`, `FIXED_AMOUNT`, and `FREE_SHIPPING` behavior MUST remain unchanged.

#### Scenario: Valid BUNDLE coupon at order create

- GIVEN a cart satisfying all BUNDLE rules and a valid coupon code
- WHEN `POST /v1/orders` includes that coupon
- THEN the order `discountAmount` reflects the bundle percentage on scoped lines only
