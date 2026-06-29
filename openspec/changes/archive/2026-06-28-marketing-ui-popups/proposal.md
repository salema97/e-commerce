# Propuesta: Popups y secciones publicitarias configurables

## Intent

Hoy el home y la tienda (web y mobile) tienen contenido promocional hardcodeado; no hay popups de lanzamiento ni banners administrables. El admin de marketing solo distribuye códigos promo por email. Se necesita que operaciones configure placements visuales (popup, banner, promo strip) desde admin y los consuman web y mobile, con opción de enlazar a promociones existentes sin duplicar el motor de descuentos.

## Scope

### In Scope (MVP)

- Modelo unificado `MarketingPlacement` (`type`: POPUP | BANNER | PROMO_STRIP; `slot`: APP_LAUNCH, HOME_HERO, STORE_TOP, STORE_INLINE; `platform`: WEB | MOBILE | ALL).
- API: CRUD admin (`SUPER_ADMIN`, `ADMIN`) con `@Audit`; `GET /v1/marketing/placements/active` público con resolución por slot (prioridad, fechas, plataforma).
- Enlace opcional `promotionId` o `ctaHref` (deep link / producto / cupón).
- Dismiss en cliente (`showOncePerSession`, `showOnceEver`, `contentVersion`); gating: popups marketing solo tras consentimiento de cookies/analytics resuelto.
- Admin: `MarketingSubNav` (Campañas | Popups y banners); CRUD placements; selector de promoción existente (sin crear/editar promociones).
- Web: provider global, popup launch, banners/strips en `/` y `/store`.
- Mobile: provider post-consent en `_layout`, popup launch, banners en home/store.
- Entrega en 4 PRs encadenados (≤400 líneas c/u): API → Admin → Web → Mobile.
- Seed de placements demo; caché Redis en endpoint público (~60–120s).

### Out of Scope (fase 2+)

- CRUD admin de promociones/cupones/reglas (DTOs existen; sin controller/UI).
- A/B testing, segmentación avanzada, personalización por usuario.
- Extender CMS como sustituto de placements.
- Push/email como superficie visual (campañas email actuales sin cambio).

## Capabilities

### New Capabilities

- `marketing-placements`: modelo, API admin/pública, resolución por slot, auditoría, caché, DTOs y hooks api-client.

### Modified Capabilities

- `frontend`: consumo web/mobile de placements, gating consent, dismiss, accesibilidad (focus-trap, ESC, `accessibilityViewIsModal`).

## Approach

Un recurso `MarketingPlacement` centraliza tipos y slots. El servicio filtra `isActive`, ventana temporal y plataforma; ordena por `priority` desc; devuelve máx. 1 popup y N banners/strips por slot. Clientes persisten dismiss local (web: `localStorage`; mobile: AsyncStorage para dismiss no sensible). Popups marketing se encolan detrás de `CookieConsentBanner` / `AnalyticsConsentBanner`. Patrón CRUD alineado a CMS/FAQ. Componente compartido opcional `PromoBanner` en `@repo/shared-ui`.

| PR | Alcance |
|----|---------|
| 1 API | Prisma, módulo marketing, endpoints, shared-types, regen api-client, seed |
| 2 Admin | Sub-nav, listas/form placements, enlace promoción |
| 3 Web | Provider, popup, banners home/store |
| 4 Mobile | Provider post-consent, popup, banners tabs |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/prisma/schema.prisma` | New | `MarketingPlacement` |
| `apps/api/src/marketing/` | Modified | Controller, service, DTOs, caché |
| `packages/shared-types/` | New | DTOs placement |
| `packages/api-client/` | New | Hooks `useMarketingPlacements` |
| `apps/web/src/lib/admin-nav.ts` | Modified | Sub-rutas marketing |
| `apps/web/src/app/admin/marketing/` | Modified | CRUD placements |
| `apps/web/src/app/page.tsx`, `store/` | Modified | Banners/strips |
| `apps/web/src/app/providers.tsx` | Modified | Provider popup |
| `apps/mobile/src/app/_layout.tsx` | Modified | Provider post-consent |
| `apps/mobile/src/app/(tabs)/` | Modified | Banners home/store |
| `packages/shared-ui/` | New/Modified | `PromoBanner` opcional |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scope creep (CRUD promos + placements) | Med | Promos CRUD explícitamente fase 2 |
| Popups compiten con consent | Med | Gating obligatorio en spec y provider |
| UX intrusiva / frequency | Med | Flags dismiss + máx. 1 popup/slot |
| PR >400 líneas | High | 4 slices estrictos; diseño acotado |
| Sin promos en seed | Med | Seed placement + promoción demo |
| Deep links mobile inválidos | Low | Validación/whitelist en admin |

## Rollback Plan

1. Desactivar placements en admin (`isActive=false`) — efecto inmediato tras invalidar caché.
2. Revertir PRs en orden inverso (Mobile → Web → Admin → API) si falla release.
3. Migración Prisma reversible: drop tabla `MarketingPlacement` solo si no hay datos productivos.

## Dependencies

- Motor `Promotion` existente (solo lectura/enlace).
- Patrones CMS/FAQ, `CatalogCacheService`, consent banners actuales.
- Pipeline regen OpenAPI → `@repo/api-client`.

## Success Criteria

- [ ] Admin crea/edita placement popup y banner con scheduling y prioridad.
- [ ] Web y mobile muestran contenido configurado en slots correctos.
- [ ] Popup marketing no aparece antes de resolver consentimiento.
- [ ] Dismiss persiste según flags del placement.
- [ ] Mutaciones admin generan `AuditLog`.
- [ ] 4 PRs mergeados a `main` dentro del presupuesto de líneas.

## Assumptions (decisiones de producto)

- MVP = placements + enlace a promos existentes; CRUD promociones en fase 2.
- Modelo unificado con promo strip como tercer `type`.
- Delivery: `auto-chain`, `stacked-to-main`, máx. 400 líneas/PR.
