# Tasks: Promotions Admin CRUD (fase 2)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900–1,200 (3 slices) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR-1 API → PR-2 List → PR-3 Detail |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No (rutas `/promotions` acordadas en diseño)

## PR-1: API + api-client

- [x] 1.1 Refactor `PromotionsController`: `@Controller('promotions')`, `@ApiTags('Promotions')`, rutas sin `admin/`
- [x] 1.2 Verificar orden de rutas (`coupons/:id`, `rules/:id` vs `:id`)
- [x] 1.3 Añadir `promotions.controller.spec.ts`
- [x] 1.4 DTOs en `dto/create-promotion.dto.ts` etc.; regla discount rule en service
- [x] 1.5 `client.ts` — namespace `promotions.*`
- [x] 1.6 `promotion-hooks.ts` + hooks.ts
- [x] 1.7 `query-keys.ts` (`promotions`, `promotion(id)`)
- [x] 1.8 Regenerar OpenAPI — `/v1/promotions` en openapi.json
- [x] 1.9 Tests: 25 passed promotion
- [x] 1.10 Eliminado `promotion-admin.*`; `PromotionsService` CRUD + `PromotionService` checkout

## PR-2: Admin lista

- [x] 2.1 `lib/marketing-page.ts`
- [x] 2.2 Layout marketing usa `requireMarketingAccess`
- [x] 2.3 Sub-nav Promociones
- [x] 2.4–2.6 page, list-view, promotion-form

## PR-3: Admin detalle

- [x] 3.1–3.4 `[id]/page.tsx`, detail-view, cupones y reglas
- [x] 3.5 Manual checkout smoke — `e2e/promotions-checkout.spec.ts` (API order + UI cupón)
- [x] 3.6 Playwright admin promociones — `e2e/admin-promotions.spec.ts`

## Post-verify

- [x] Actualizar `openspec/specs/` con delta promotions-admin
- [x] Archive change `promotions-admin-crud`
