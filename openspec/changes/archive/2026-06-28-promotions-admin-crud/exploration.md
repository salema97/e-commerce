# Exploración: CRUD admin de promociones (fase 2)

## Contexto

Fase 2 del change `marketing-ui-popups`. El MVP entregó placements + selector read-only de promociones. Los admins no pueden crear cupones ni reglas desde el panel; hoy dependen del seed o inserción manual en DB.

## Estado del código

| Área | Estado |
|------|--------|
| Prisma `Promotion`, `Coupon`, `DiscountRule` | ✅ Existe |
| `PromotionService` (checkout) | ✅ En `PromotionsModule` |
| `PromotionAdminService` | ✅ Implementado (parcial) |
| `PromotionsController` | ⚠️ Rutas en `marketing/promotions/admin/*` (no alineado con suppliers/products) |
| `promotion-admin.service.spec.ts` | ✅ Tests básicos |
| `promotions.controller.spec.ts` | ❌ Falta |
| `packages/shared-types/promotion.ts` | ✅ DTOs ampliados |
| `api-client` admin methods/hooks | ❌ Incompleto (solo query-keys) |
| Admin UI `/admin/marketing/promotions` | ❌ No existe |
| `GET /v1/marketing/promotions` | ✅ Picker campañas (id+name activas) |

## Patrones del monorepo (referencia)

### API — mayoría de módulos CRUD

- Controller en dominio propio: `@Controller('suppliers')`, `@Controller('products')`.
- Sin segmento `/admin/` en URL; seguridad vía `@Roles` + JWT global guard.
- Mutaciones con `@Audit({ resource, action })`.

### API — excepción `/admin/` en URL

Solo cuando público y staff comparten prefijo (FAQ, CMS, placements `active` vs `admin/list`). Promociones **no** tienen endpoint público en el mismo controller; el picker ya es staff-only.

### Web admin

- `admin-nav.ts` + `middleware.ts`: `/admin/marketing` → `SUPER_ADMIN`, `ADMIN`.
- Secciones con `layout.tsx` + `*SubNav` (marketing, knowledge, finance).
- Page SSR: prefetch + view client; finance usa `requireFinanceAccess()` — marketing repite redirect inline (deuda a unificar con `requireMarketingAccess`).

### UI CRUD simple vs anidado

- Lista + dialog: placements.
- Lista + página `[id]`: products (hijos/complejidad).

Promociones tienen cupones y reglas → patrón **products `[id]`** para detalle.

## Brecha de uniformidad detectada

El trabajo parcial de fase 2 copió el sub-patrón `marketing/placements/admin/*`. El equipo acordó alinear con el patrón dominante **`/v1/promotions`** y dejar marketing solo para campañas/distribución.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Refactor de rutas parciales | PR-1 mueve controller; sin consumidores externos aún |
| Borrar promo con placements vinculados | Prisma `onDelete: SetNull` en `MarketingPlacement.promotionId` |
| Cupón duplicado | `ConflictException` ya en service |
| PR >400 líneas | 3 slices: API, lista, detalle |

## Dependencias

- `marketing-ui-popups` archivado (placements + picker).
- `PromotionService` sin cambios de contrato checkout.
- Regen OpenAPI → `@repo/api-client`.
