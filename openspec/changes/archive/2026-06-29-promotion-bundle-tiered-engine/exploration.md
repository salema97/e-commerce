# Exploration: BUNDLE / TIERED promotion engine in checkout

## Current State

### Checkout motor (`PromotionService`)

- `validateCoupon` checks coupon/promotion lifecycle (active, dates, usage limit) and iterates `discountRules` for **global** `minimumAmount` (full-cart subtotal) and `minimumQuantity` (sum of all line quantities).
- **`applicableProductId` and `applicableCategoryId` are stored in admin CRUD but never evaluated at checkout.**
- `applyPromotion` switch:
  - `PERCENTAGE` / `FIXED_AMOUNT` / `FREE_SHIPPING` — implemented.
  - `BUNDLE` / `TIERED` — **stub**: same as percentage on full subtotal when `promotion.value` is set (comment: "full tier/bundle logic deferred").
- `CartItemInput` = `{ productId, variantId?, price, quantity }` — no `categoryId`; `Product.categoryId` exists in Prisma.
- `OrdersService.create` calls `validateCoupon` then `computeDiscountTotals`; stores aggregate `discountAmount` on order; `buildOrderItems` → `allocateItemTotals` spreads discount **proportionally across all lines**.
- `TaxService.calculateForCart` also spreads `orderDiscount` proportionally by line subtotal.
- Web checkout has **no live coupon quote** — coupon validated only on order create.

### Schema (`Promotion`, `DiscountRule`)

```prisma
model Promotion {
  type  PromotionType  // includes BUNDLE, TIERED
  value Decimal?       // used for %, fixed, and BUNDLE/TIERED stub
  discountRules DiscountRule[]
}

model DiscountRule {
  minimumQuantity      Int?
  minimumAmount        Decimal?
  applicableProductId  String?
  applicableCategoryId String?
  // NO per-tier / per-rule discount value
}
```

### Admin CRUD (`PromotionsService` + web)

- CRUD complete under `/v1/promotions`; rules require at least one constraint field.
- `VALUE_REQUIRED_TYPES` = only `PERCENTAGE` | `FIXED_AMOUNT` — BUNDLE/TIERED can be created with `value` optional (UI also hides value field for BUNDLE/TIERED).
- Admin detail page manages rules (min amount/qty, product, category) but **no per-rule discount**, no rule ordering UI, no type-specific help text.
- Seed: `VERANO10` is `PERCENTAGE` with rule `{ minimumAmount: 50, applicableCategoryId: electronics }` — category gate is **not enforced** today.

### Tests

- `promotion.service.spec.ts` — PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING only; no BUNDLE/TIERED.
- `promotions-checkout.spec.ts` — PERCENTAGE smoke only.
- `orders.service.spec.ts` — mocks `PromotionService`; no integration for scoped discounts.

### Architecture note

`AGENTS.md` references a `PromotionEngine` abstraction; **not implemented** — logic lives inline in `PromotionService`.

---

## Recommended Semantics

### Shared concepts

| Concept | Definition |
|---------|------------|
| **Eligible lines** | Cart lines matching a rule's `applicableProductId` and/or `applicableCategoryId` (category resolved via batch `Product` lookup). Rules with neither scope apply to **full cart**. |
| **Scoped subtotal** | Sum of `price × quantity` for eligible lines. |
| **Rule satisfaction** | Per-rule predicates evaluated on eligible scope (not always full cart). |

### `BUNDLE`

**Intent:** Customer must satisfy **all** discount rules (AND) — each rule is one bundle component.

| Rule fields | Meaning |
|-------------|---------|
| `applicableProductId` + `minimumQuantity` | At least N units of that product in cart |
| `applicableCategoryId` + `minimumQuantity` | At least N units of products in category |
| `minimumAmount` | Min spend on that rule's scope |
| Defaults | `minimumQuantity` defaults to **1** when product/category set and qty omitted |

**Discount:** When every rule passes:

- If `promotion.value` is set: apply as **percentage** on the **union** of eligible line subtotals (dedupe lines matched by multiple rules).
- Future extension: support `FIXED_AMOUNT` on bundle via `promotion.type` interpretation or rule-level value (needs schema).

**Validation failure:** Reject coupon if any component rule fails (specific error message per missing component).

### `TIERED`

**Intent:** Escalating thresholds; apply the **best matching tier** (highest threshold met).

| Without schema change | With optional `discountValue` on `DiscountRule` (recommended) |
|-----------------------|---------------------------------------------------------------|
| Rules are only thresholds; **single rate** from `promotion.value` — multiple tiers with same % are redundant | Each rule = tier: threshold (`minimumQuantity` and/or `minimumAmount` on scope) + `discountValue` (% or fixed per rule) |
| Usable only as "quantity/spend gate unlocks one discount rate" | True multi-rate volume pricing (e.g. 5+ → 10%, 10+ → 15%) |

**Tier selection (with `discountValue`):**

1. Sort rules by threshold descending (`minimumQuantity`, then `minimumAmount`).
2. For each rule, evaluate threshold on its scope (scoped qty or scoped subtotal).
3. Pick first (highest) matching tier; apply its `discountValue` as % or fixed on scoped subtotal (inherit discount mode from promotion or per-rule `valueType`).

**Fallback:** If `discountValue` is null on matched rule, use `promotion.value`.

### `validateCoupon` alignment

Move rule evaluation into shared helpers used by both validation and apply:

- Global gates (`minimumAmount` / `minimumQuantity` with **no** product/category) — keep as cart-wide preconditions.
- Scoped rules — evaluate on eligible lines; for BUNDLE all must pass; for TIERED at least one tier must match.

---

## Affected Areas

| Path | Why |
|------|-----|
| `apps/api/src/promotions/promotion.service.ts` | Core BUNDLE/TIERED logic, category lookup, line-level discount breakdown |
| `apps/api/src/promotions/promotion.service.spec.ts` | Unit tests for bundle AND, tier selection, scoped subtotals |
| `apps/api/src/promotions/promotions.service.ts` | Admin validation: BUNDLE requires ≥1 rule; TIERED requires ≥1 rule; optional `value`/`discountValue` rules |
| `apps/api/src/orders/orders.service.ts` | Consume per-line discounts when provided (avoid mis-allocating scoped discount) |
| `apps/api/src/tax/tax.service.ts` | May need per-line discount input if order-level proportional spread is insufficient |
| `apps/api/prisma/schema.prisma` | Optional: `discountValue` on `DiscountRule` for true TIERED |
| `apps/api/src/promotions/dto/promotion-discount-rule.dto.ts` | `discountValue` field if migrated |
| `packages/shared-types/src/promotion.ts` | `DiscountRule.discountValue`, `AppliedPromotion` line breakdown (optional) |
| `apps/web/.../promotion-form.tsx` | BUNDLE/TIERED value field + help copy |
| `apps/web/.../promotion-detail-view.tsx` | Per-rule `discountValue` for TIERED; rule ordering hint |
| `apps/web/e2e/promotions-checkout.spec.ts` | BUNDLE + TIERED API checkout scenarios |
| `apps/web/e2e/fixtures/auth.ts` | Extend `createTestPromotion` for BUNDLE/TIERED + rules |
| `openspec/specs/promotions-admin/spec.md` | Delta: checkout semantics for BUNDLE/TIERED |

**Low touch:** `PromotionsController`, api-client hooks (only if DTO/schema changes), web checkout UI (no preview endpoint today).

---

## Approaches

### 1. No migration — BUNDLE full, TIERED as threshold gate

Implement BUNDLE with existing schema. TIERED = pick highest matching `minimumQuantity`/`minimumAmount` rule, apply single `promotion.value` on scoped/full subtotal.

| Pros | Cons |
|------|------|
| No Prisma migration | TIERED is not true multi-rate volume pricing |
| Smaller PR (~250–350 lines) | Admins may expect per-tier % (UI says "Escalonada") |
| Unblocks bundle combos (buy A + B) | `discountValue` per tier deferred |

**Effort:** Medium

### 2. Nullable `discountValue` on `DiscountRule` (recommended)

Add `discountValue Decimal?` to `DiscountRule`. TIERED tiers carry their own rate; backward compatible (null → `promotion.value`). BUNDLE unchanged.

| Pros | Cons |
|------|------|
| True TIERED semantics | One small migration + DTO/admin UI |
| Nullable column — existing rows unaffected | Slightly larger change set (~400–500 lines) |
| Matches admin mental model for "escalonada" | Need rule ordering / tier selection tests |

**Effort:** Medium–High → **chained PRs** under auto-chain delivery

### 3. Full `PromotionEngine` extraction now

Strategy per `PromotionType` behind a port; migrate all types from `PromotionService`.

| Pros | Cons |
|------|------|
| Aligns with AGENTS.md long-term | Scope creep for this change |
| Easier to add BOGO, BXGY later | Touches all promotion tests + checkout |

**Effort:** High — defer to follow-up refactor after BUNDLE/TIERED ship

---

## Recommendation

**Approach 2** — nullable `discountValue` on `DiscountRule` + shared evaluation helpers in `PromotionService`.

**Slice plan (auto-chain):**

1. **PR-A — Engine + tests:** `promotion.service` BUNDLE/TIERED, category resolution, `validateCoupon` scoped rules, unit tests. Optional migration in same PR if small.
2. **PR-B — Orders/tax line discounts:** Pass line-level discount map from engine to `buildOrderItems` / tax so scoped discounts don't leak across unrelated SKUs.
3. **PR-C — Admin + E2E:** DTO/UI for `discountValue`, validation in `PromotionsService`, checkout e2e fixtures.

**Semantics summary:**

- **BUNDLE:** ALL rules satisfied (AND) → `%` from `promotion.value` on union of scoped lines.
- **TIERED:** BEST tier satisfied (OR by threshold height) → `discountValue ?? promotion.value` on tier scope.

---

## Migration Needed?

| Scenario | Migration |
|----------|-----------|
| BUNDLE only, single `promotion.value` | **No** |
| True multi-rate TIERED | **Yes** — add `discountValue Decimal?` to `DiscountRule` (preferred minimal change) |
| BOGO / fixed bundle price / BXGY | **Yes** — likely more fields or new rule type enum (out of scope) |

**Verdict:** One optional nullable column is **justified and low-risk** for TIERED; BUNDLE does not require it.

---

## Risks

1. **Scoped discount vs proportional allocation** — Today order discount is spread across all lines; category/product-specific discounts will mis-allocate tax and `OrderItem.discountAmount` unless engine returns per-line amounts (PR-B).
2. **`applicableCategoryId` silently ignored** — Seed `VERANO10` rule does not filter electronics today; fixing this changes behavior for existing coupons (document in proposal).
3. **No checkout preview API** — Customers only see discount after order create; BUNDLE/TIERED complexity won't surface in UI until payment (acceptable for MVP; future `POST /cart/quote` optional).
4. **Single coupon per order** — No stacking; engine assumes one `couponCode` (unchanged).
5. **Cart price trust** — Engine uses client-provided `price`; same as existing PERCENTAGE flow (server should re-validate prices in `validateItems` — already done in orders).
6. **400-line budget** — Full slice likely exceeds budget → chained PRs required.

---

## Ready for Proposal

**Yes.** Proposal should lock:

- BUNDLE = AND rules, discount base = union scoped subtotal, rate = `promotion.value` (%).
- TIERED = best tier, rate = `discountValue ?? promotion.value`.
- Migration: nullable `discountValue` on `DiscountRule`.
- PR chain: engine → orders/tax allocation → admin/e2e.
- Breaking change notice: category/product rules start enforcing on existing promotions.
