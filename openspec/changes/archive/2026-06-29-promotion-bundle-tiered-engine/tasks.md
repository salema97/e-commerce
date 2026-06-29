# Tasks: BUNDLE / TIERED Promotion Engine

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~450–550 total (~150–200 per PR) |
| 400-line budget risk | Medium (per PR Low–Medium) |
| Chained PRs recommended | Yes |
| Suggested split | PR-A engine+migration → PR-B orders/tax → PR-C admin+e2e |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No

## Phase 1: Engine + Migration (PR-A)

- [x] 1.1 Add `discountValue Decimal?` to `DiscountRule` in schema + migration
- [x] 1.2 Create `promotion-rule-evaluator.ts`
- [x] 1.3 Extend `packages/shared-types` — `DiscountRule.discountValue`
- [x] 1.4 Wire `promotion.service.ts` — batch category lookup, BUNDLE/TIERED branches
- [x] 1.5 `computeDiscountTotals` returns `lineDiscounts[]`
- [x] 1.6 Unit tests `promotion.service.spec.ts` — 15 tests PASS

## Phase 2: Orders & Tax (PR-B)

- [x] 2.1 `orders.service.ts` — pass `lineDiscounts` to allocation
- [x] 2.2 `tax.service.ts` — `promotionLineDiscounts` per-line before loyalty spread
- [x] 2.3 Tax + orders tests PASS (39 promotion/orders/tax tests)
- [x] 2.4 `orders.service.spec.ts` mocks still pass

## Phase 3: Admin + E2E (PR-C)

- [x] 3.1 DTO `discountValue` on discount rules
- [x] 3.2 `promotions.service.ts` — BUNDLE requires value; TIERED `discountValue` validation
- [x] 3.3 Admin tests via existing `promotions.service.spec`
- [x] 3.4 Regenerate api-client OpenAPI (DTO only — optional if no controller change)
- [x] 3.5 `promotion-form.tsx` — BUNDLE/TIERED value + help copy
- [x] 3.6 `promotion-detail-view.tsx` — per-tier `discountValue` + hints
- [x] 3.7 E2E fixtures — `createTestPromotion` + rules
- [x] 3.8 E2E `promotions-checkout.spec.ts` — BUNDLE + TIERED scenarios

## Rollout Notes

- Breaking change: scoped `applicableCategoryId` / `applicableProductId` now enforced at checkout.
- Run migration: `pnpm --filter @repo/api prisma:migrate dev`
- Defer full `PromotionEngine` extraction to follow-up.
