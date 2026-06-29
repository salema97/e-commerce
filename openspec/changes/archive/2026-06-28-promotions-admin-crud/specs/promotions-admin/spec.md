# Promotions Admin Specification

## Purpose

Enable staff to manage promotions, coupons, and discount rules from the admin panel via a REST API consistent with domain controllers (`/v1/promotions`).

## Requirements

### Requirement: Promotions admin API

The system MUST expose authenticated admin endpoints under `/v1/promotions` for `SUPER_ADMIN` and `ADMIN` only.

| Method | Path | Action |
|--------|------|--------|
| GET | `/v1/promotions` | List promotions (optional filters: `isActive`, `type`) |
| GET | `/v1/promotions/:id` | Get promotion with `coupons` and `discountRules` |
| POST | `/v1/promotions` | Create promotion |
| PATCH | `/v1/promotions/:id` | Update promotion |
| DELETE | `/v1/promotions/:id` | Delete promotion (cascade coupons/rules; placements `promotionId` set null) |

Nested resources:

| Method | Path | Action |
|--------|------|--------|
| POST | `/v1/promotions/:id/coupons` | Create coupon |
| PATCH | `/v1/promotions/coupons/:couponId` | Update coupon |
| DELETE | `/v1/promotions/coupons/:couponId` | Delete coupon |
| POST | `/v1/promotions/:id/rules` | Create discount rule |
| PATCH | `/v1/promotions/rules/:ruleId` | Update discount rule |
| DELETE | `/v1/promotions/rules/:ruleId` | Delete discount rule |

All mutations MUST append an `AuditLog` via `@Audit`.

#### Scenario: Admin creates percentage promotion

- GIVEN an authenticated ADMIN
- WHEN they POST a promotion with `type=PERCENTAGE`, `value=15`, `name=Verano`
- THEN the promotion is persisted and returned with id

#### Scenario: Duplicate coupon code rejected

- GIVEN coupon code `SUMMER` already exists
- WHEN admin POST a new coupon with code `summer`
- THEN API returns 409 Conflict

#### Scenario: Finance role denied

- GIVEN an authenticated FINANCE user
- WHEN they GET `/v1/promotions`
- THEN API returns 403 Forbidden

---

### Requirement: Marketing promotion picker unchanged

`GET /v1/marketing/promotions` MUST continue returning active promotions as `{ id, name }[]` for campaign distribution and placement selectors.

#### Scenario: Campaign view still works

- GIVEN seeded active promotion
- WHEN admin opens `/admin/marketing`
- THEN promotion appears in distribute dropdown

---

### Requirement: Promotion field validation

| Field | Rules |
|-------|-------|
| `name` | Required, max 200 chars |
| `type` | `PERCENTAGE` \| `FIXED_AMOUNT` \| `FREE_SHIPPING` \| `BUNDLE` \| `TIERED` |
| `value` | Required for PERCENTAGE and FIXED_AMOUNT |
| `startsAt` / `endsAt` | Optional ISO dates; `endsAt` > `startsAt` |
| Coupon `code` | Required, unique, normalized uppercase |
| Rule | At least one constraint field set |

#### Scenario: Free shipping without value

- GIVEN `type=FREE_SHIPPING`
- WHEN admin creates promotion without `value`
- THEN creation succeeds

---

### Requirement: Checkout integration unchanged

`PromotionService.validateCoupon` and `applyPromotion` MUST continue to use DB state managed by admin CRUD without API changes to checkout.

#### Scenario: New coupon works at checkout

- GIVEN admin created coupon `VERANO20` on active promotion
- WHEN customer applies code at checkout
- THEN discount is calculated per promotion type
