# Exploración: Popups iniciales y secciones publicitarias configurables

## Estado actual

### Admin — navegación y marketing existente

- La navegación admin se centraliza en `apps/web/src/lib/admin-nav.ts` con RBAC por rol y grupos (`catalog`, `sales`, `support`, `finance`, `knowledge`).
- `/admin/marketing` existe como ítem único (roles `SUPER_ADMIN`, `ADMIN`, grupo `sales`, icono Megaphone en sidebar).
- Hoy solo renderiza `MarketingCampaignsView`: distribución de códigos promo a segmentos (`ALL_CUSTOMERS`, `HAS_ACTIVE_CART`, etc.) vía `POST /v1/marketing/campaigns/promo`.
- No hay sub-navegación en marketing. El patrón de referencia para secciones múltiples es **Conocimiento** (`KnowledgeSubNav` + `AdminSectionNav`): Resumen / FAQs / CMS bajo `/admin/knowledge/*`.

### API — promociones vs contenido visual

| Capa | Existe | Detalle |
|------|--------|---------|
| `Promotion` + `Coupon` + `DiscountRule` (Prisma) | ✅ | Motor de descuentos en checkout |
| `PromotionService` | ✅ | `validateCoupon`, `applyPromotion`, `calculateOrderTotals` — solo lógica de carrito/pedido |
| `MarketingController` | ✅ parcial | `GET /marketing/promotions` (lista activas), `POST /marketing/campaigns/promo` (email segmentado) |
| CRUD admin de promociones/cupones | ❌ | DTOs en `@repo/shared-types` (`CreatePromotionDto`, etc.) pero **sin controller ni UI** |
| `CmsPage` + CRUD | ✅ | Patrón completo: público por slug, admin list, `@Audit`, `@Roles` |
| `Faq` + CRUD | ✅ | Mismo patrón que CMS |
| `AppPopup` / `Banner` / `Advertisement` | ❌ | No hay modelos ni endpoints |

### Consumo público — web y mobile

**Web**

- Contenido público vía `apps/web/src/lib/public-catalog.ts` (`createApiClient` sin auth) para catálogo, FAQs y CMS.
- Landing (`/`) y tienda (`/store`) son estáticas en código: hero, categorías, productos destacados, CTA hardcodeado («No te pierdas las novedades»).
- `CookieConsentBanner` en `AnalyticsProvider` — modal de cumplimiento, no marketing.
- No hay fetch de banners/popups configurables ni slots de placement.

**Mobile**

- `AnalyticsConsentBanner` en `_layout.tsx` — overlay de consentimiento (SecureStore), no promocional.
- Home (`(tabs)/index.tsx`) y Store (`(tabs)/store.tsx`) cargan productos/catálogo; sin sección promo configurable.
- CMS legal consume `useCmsPageBySlug` en `legal/[slug].tsx` — patrón reutilizable para contenido remoto.
- `@repo/shared-ui` expone `Modal` (neo-brutalist, RN) listo para popups de lanzamiento.

### Motor de promociones — puntos de integración

- **Checkout**: `PromotionService` en `orders.service.ts` — cupones aplican descuento, no UI.
- **Marketing email**: `MarketingAutomationService` + segmentos — envío async de códigos, no superficie in-app.
- **Admin marketing UI**: solo selecciona `promotionId` existente para distribuir; no crea ni edita promociones.
- **Desacople necesario**: contenido visual (popup/banner) ≠ regla de descuento; enlace opcional vía `promotionId` o `ctaHref` (deep link, producto, cupón pre-rellenado).

### Patrones CRUD admin (referencia CMS/FAQ)

```
Controller: @Public en GET público | @Roles + @Audit en mutaciones
Service: Prisma + side effects (CMS indexa knowledge)
DTO: class-validator en API, espejo en shared-types
Web admin: Server Component prefetch + client view + useApiQueryHooks
api-client: hooks en content-hooks / ops-hooks + queryKeys + regeneración OpenAPI
```

## Brechas vs feature solicitada

| Requisito | Gap |
|-----------|-----|
| Popup al abrir app (mobile) / primera visita (web) | Sin modelo, API, dismiss logic ni provider global |
| Banners/secciones promo en home y tienda | Contenido hardcodeado; sin slots ni API pública |
| CRUD desde admin | Marketing solo distribuye; sin CRUD placements ni promociones |
| Consumo web + mobile | Sin endpoint unificado ni hooks `useMarketingPlacements` |
| Vinculación a promociones | Motor existe pero desconectado de superficie visual |
| Programación (fechas, prioridad, plataforma) | `Promotion` tiene `startsAt`/`endsAt`; placements necesitan lo propio |
| Auditoría | Patrón `@Audit` listo; falta aplicarlo a nuevo recurso |
| Consentimiento / no intrusión | Consent banners separados; popups marketing deben respetar orden (consent primero) y frequency caps |

## Áreas afectadas

| Ruta | Motivo |
|------|--------|
| `apps/api/prisma/schema.prisma` | Nuevos modelos (`MarketingPlacement` o equivalente) |
| `apps/api/src/marketing/` o módulo nuevo | Controller, service, DTOs, caché opcional |
| `packages/shared-types/src/` | Tipos + DTOs placements |
| `packages/api-client/` | Cliente, hooks, OpenAPI regen |
| `apps/web/src/lib/admin-nav.ts` | Sub-rutas marketing (si se expande nav) |
| `apps/web/src/app/admin/marketing/` | Sub-nav + vistas CRUD popups/banners/promociones |
| `apps/web/src/app/page.tsx`, `store/page.tsx` | Render banners |
| `apps/web/src/app/providers.tsx` o layout | Provider popup web |
| `apps/mobile/src/app/_layout.tsx` | Provider popup mobile (post-consent) |
| `apps/mobile/src/app/(tabs)/index.tsx`, `store.tsx` | Banners inline |
| `packages/shared-ui/` | Posible `PromoBanner` compartido web/RN |

## Enfoques

### 1. Modelo unificado `MarketingPlacement` (recomendado)

Un recurso con `type` (`POPUP` | `BANNER`), `slot` (`APP_LAUNCH`, `HOME_HERO`, `STORE_TOP`, `STORE_INLINE`), `platform` (`WEB`, `MOBILE`, `ALL`), campos de contenido (título, cuerpo, imagen, CTA), scheduling, prioridad, `promotionId` opcional.

- **Pros**: Un CRUD admin, una API pública, reglas de resolución centralizadas (prioridad + fechas + plataforma), encaja con auto-chain en slices por capa.
- **Contras**: Modelo más rico; validación de slots en service.
- **Esfuerzo**: Medio-alto (API + 2 clientes + admin).

### 2. Modelos separados `AppPopup` y `PromoBanner`

Dos entidades, dos controllers, dos vistas admin.

- **Pros**: Semántica clara, schemas simples por tipo.
- **Contras**: Duplicación DTO/service/hooks/UI; dos APIs públicas que mantener.
- **Esfuerzo**: Medio (más archivos, misma superficie total).

### 3. Extender CMS (`CmsPage` con `kind: popup|banner`)

Reutilizar CMS existente con convención de slug y frontmatter.

- **Pros**: Menos schema; admin CMS ya existe.
- **Contras**: CMS es markdown estático — mal fit para scheduling, slots, dismiss, prioridad, CTA a promoción, targeting por plataforma; mezcla conocimiento legal con marketing.
- **Esfuerzo**: Bajo inicial, alto deuda técnica.
- **Veredicto**: No recomendado.

### 4. Solo UI hardcodeada + Feature flags PostHog

- **Pros**: Rápido para experimentos.
- **Contras**: No cumple «configurable desde admin»; fuera de alcance del producto.
- **Esfuerzo**: Bajo — descartado.

## Recomendación

**Enfoque 1 (`MarketingPlacement`)** con entrega en cadena (delivery `auto-chain`, presupuesto 400 líneas/PR):

| Slice | Alcance |
|-------|---------|
| PR-1 | Prisma + API CRUD admin + `GET /marketing/placements/active` público + audit + shared-types + api-client |
| PR-2 | Admin: `MarketingSubNav` (Campañas \| Popups y banners \| Promociones*) + vistas CRUD placements |
| PR-3 | Web: `MarketingPlacementProvider`, popup launch, banners en `/` y `/store` |
| PR-4 | Mobile: provider en `_layout`, popup post-consent, banners en home/store |

\*CRUD promociones puede ser PR-2b si el alcance de «promociones desde admin» es obligatorio en MVP; hoy no hay API y los DTOs ya existen en shared-types.

**Resolución de placement (servidor)**

1. Filtrar `isActive`, `startsAt`/`endsAt`, `platform`.
2. Ordenar por `priority` desc, `updatedAt` desc.
3. Devolver máximo 1 popup activo por slot + N banners por slot (configurable).

**Dismiss / frequency (cliente)**

- Clave: `marketing:dismissed:{placementId}` o versión (`contentVersion`).
- Web: `localStorage`; mobile: `expo-secure-store` o AsyncStorage para dismiss no sensible.
- `showOncePerSession` / `showOnceEver` como flags en el modelo.

**Orden con consentimiento**

- Web: popup marketing solo después de resolver `CookieConsentBanner` (o si ya hay consent guardado).
- Mobile: popup después de `AnalyticsConsentBanner` dismiss o si ya hay consent.

**Caché**

- Endpoint público cacheable (Redis TTL ~60–120s, patrón `CatalogCacheService`) — invalidar en mutaciones admin.

## Riesgos

- **Scope creep**: CRUD promociones + placements + distribución email en un solo release — separar promociones CRUD si no es blocker de popups.
- **UX intrusiva**: Popups de marketing compitiendo con consent — definir z-index y gating explícito en spec.
- **Sin seed**: No hay promociones en seed actual; demos necesitarán seed de placements + al menos una promoción.
- **OpenAPI regen**: Cambios API requieren pipeline `api-client` regenerate — incluir en tasks.
- **Accesibilidad**: Popups deben ser focus-trap, ESC dismiss (web), `accessibilityViewIsModal` (RN).
- **Deep links mobile**: CTA a rutas internas (`/(tabs)/store`, producto) — validar en admin o whitelist.
- **400-line budget**: Feature completa excede un PR — chained PRs obligatorios (`Chained PRs recommended: Yes`).

## Listo para propuesta

**Sí.** El orchestrator debe ejecutar `sdd-propose` con:

- Alcance MVP: placements (popup + banner), admin CRUD, consumo web/mobile, dismiss logic, gating consent.
- Decisión explícita: ¿incluir CRUD promociones/cupones en MVP o fase 2?
- Delivery: auto-chain, 4 slices estimados.
- Idioma artefactos openspec: español (según `openspec/config.yaml`).
