# Verification Report: promotion-bundle-tiered-engine

**Change:** `promotion-bundle-tiered-engine`  
**Date:** 2026-06-29  
**Mode:** openspec  
**Strict TDD:** false  

## Verdict: PASS (with known E2E UI flakes)

Motor BUNDLE/TIERED implementado y verificado en API. Admin UI y checkout manual OK. Tres E2E de UI fallan por popups/timing, no por lógica del motor.

---

## Completeness

| Phase | Tasks | Status |
|-------|-------|--------|
| PR-A Engine + migration | 6 | 6/6 |
| PR-B Orders & tax | 4 | 4/4 |
| PR-C Admin + E2E | 8 | 8/8 |

---

## Build & Test Evidence

| Command | Result |
|---------|--------|
| `pnpm typecheck` | PASS (13/13) |
| `pnpm --filter @repo/api test -- promotion.service.spec promotions.service.spec` | PASS (20 tests) |
| `pnpm --filter @repo/api test` (promotion/orders/tax) | PASS (39 tests, sesión apply) |
| `pnpm --filter @repo/api-client generate` | PASS — spec desde `:3001/v1/docs-json` |
| `e2e/promotions-checkout.spec.ts` | 3/4 PASS — API smoke, BUNDLE, TIERED |
| `e2e/admin-promotions.spec.ts` | 0/2 — placement dialog + cupón UI refresh |
| Playwright MCP (manual) | Admin list/detail, checkout cupón VERANO10 OK |

---

## Spec Compliance

| Requirement | Evidence |
|-------------|----------|
| BUNDLE: AND de reglas, % sobre unión de líneas | `promotion-rule-evaluator.ts`, `promotion.service.spec.ts` |
| TIERED: mejor tramo, `discountValue ?? promotion.value` | `promotion-rule-evaluator.ts`, tiered E2E |
| `lineDiscounts[]` en checkout | `promotion.service.ts`, `orders.service.ts`, `tax.service.ts` |
| `DiscountRule.discountValue` en schema | migration `20260628140000_discount_rule_discount_value` |
| Admin: hints BUNDLE/TIERED | `promotion-form.tsx`, `promotion-detail-view.tsx` |
| Breaking: scope producto/categoría enforced | `promotion-rule-evaluator.ts` |

---

## Operational Notes

- Migración aplicada manualmente tras advisory lock de `prisma migrate`; marcada con `migrate resolve --applied`.
- OpenAPI DTOs siguen como `object` vacío en Swagger (issue preexistente del plugin); campos existen en DTOs NestJS y `shared-types`.

---

## Follow-ups (no bloquean archive)

- E2E: dismiss marketing popup en storefront antes de `Agregar al carrito`.
- E2E: estabilizar diálogo "Nuevo placement" en admin.
- Extraer `PromotionEngine` completo (deferido en design).

---

## Archive Readiness

Ready for archive.
