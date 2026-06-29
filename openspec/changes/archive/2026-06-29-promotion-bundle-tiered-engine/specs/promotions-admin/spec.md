# Delta for Promotions Admin

## MODIFIED Requirements

### Requirement: Checkout integration

`PromotionService` applies coupons from DB state managed by admin CRUD. The checkout engine MUST enforce scoped `discountRules` for all promotion types, including `BUNDLE` and `TIERED`, as specified in the promotions checkout engine spec. Category and product constraints configured in admin MUST affect checkout validation and discount application.
(Previously: checkout integration was declared unchanged; scoped rules were stored but not enforced at checkout.)

#### Scenario: Admin-configured category rule affects checkout

- GIVEN promotion `VERANO10` with a rule scoped to electronics and `minimumAmount` 50
- AND a cart with $60 of non-electronics items only
- WHEN checkout applies the coupon
- THEN the coupon is rejected for unmet scoped conditions

## ADDED Requirements

### Requirement: Tier discount value on rules

`DiscountRule` MUST support an optional nullable `discountValue` (decimal). TIERED promotions MAY define per-tier rates via `discountValue`; when null, checkout MUST fall back to `promotion.value`.

#### Scenario: Admin creates tier with explicit rate

- GIVEN an admin creates a TIERED promotion with a rule `{ minimumQuantity: 5, discountValue: 10 }`
- WHEN the promotion is fetched via `GET /v1/promotions/:id`
- THEN the rule includes `discountValue: 10`

### Requirement: BUNDLE and TIERED admin validation

Creating or updating a `BUNDLE` or `TIERED` promotion MUST require at least one discount rule. `promotion.value` MUST remain optional for these types. `VALUE_REQUIRED_TYPES` MUST continue to require `value` only for `PERCENTAGE` and `FIXED_AMOUNT`.

#### Scenario: BUNDLE without rules rejected

- GIVEN an admin submits `POST /v1/promotions` with `type: BUNDLE` and no rules
- WHEN the API validates the payload
- THEN the request is rejected with a validation error

### Requirement: Admin UI for BUNDLE and TIERED configuration

The admin promotion form MUST expose `promotion.value` for BUNDLE (bundle discount percentage) with contextual help. The promotion detail view MUST allow `discountValue` per rule for TIERED promotions and indicate that higher thresholds should carry higher tiers.

#### Scenario: TIERED rule editor shows tier rate field

- GIVEN an admin opens a TIERED promotion detail page
- WHEN they add or edit a discount rule
- THEN they can set `discountValue` for that tier
