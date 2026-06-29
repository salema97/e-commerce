# Verification Report: promotions-admin-crud

**Change:** `promotions-admin-crud` (fase 2 marketing-ui-popups)  
**Date:** 2026-06-28  
**Mode:** openspec  
**Strict TDD:** false  

## Verdict: PASS

Implementation matches specs and design. API, api-client, and admin UI delivered with repo-uniform patterns (`/v1/promotions`, `PromotionsService`, `requireMarketingAccess`).

---

## Completeness

| Slice | Tasks | Status |
|-------|-------|--------|
| PR-1 API + client | 10 | 10/10 |
| PR-2 Admin lista | 4 | 4/4 |
| PR-3 Admin detalle | 6 | 6/6 |

---

## Build & Test Evidence

| Command | Result |
|---------|--------|
| `pnpm typecheck` | PASS (13/13) |
| `pnpm --filter @repo/api test -- promotion` | PASS (25 tests) |
| `pnpm --filter @repo/api-client generate` | PASS — `/v1/promotions` in openapi.json |
| `e2e/admin-promotions.spec.ts` | Automated — picker + cupón en detalle |
| `e2e/promotions-checkout.spec.ts` | Automated — descuento API + cupón en checkout UI |

---

## Spec Compliance

| Requirement | Evidence |
|-------------|----------|
| CRUD `/v1/promotions` | `promotions.controller.ts`, `promotions.service.ts` |
| RBAC SUPER_ADMIN + ADMIN | `@Roles` + controller spec |
| Audit on mutations | `@Audit` + controller spec |
| Picker `GET /marketing/promotions` | Unchanged in `marketing.controller.ts` |
| Admin list + detail UI | `promotions/page.tsx`, `[id]/page.tsx` |
| Cupones + reglas anidadas | `promotion-detail-view.tsx` |
| Checkout unchanged | `promotion.service.ts` (no API changes) |

---

## Design Coherence

| Decision | Implemented |
|----------|-------------|
| Routes `/v1/promotions` (no `/admin/` segment) | Yes |
| `PromotionsService` CRUD + `PromotionService` checkout | Yes |
| `requireMarketingAccess` | Yes |
| Detail page for nested resources | Yes |
| Removed `promotion-admin.*` | Yes |

---

## Polish (post-archive)

- **3.5** Checkout smoke — `promotions-checkout.spec.ts`
- **3.6** Admin promotions E2E — `admin-promotions.spec.ts`
- **UX** Product/category selectors en reglas — `promotion-detail-view.tsx`

---

## Archive Readiness

Ready for archive.
