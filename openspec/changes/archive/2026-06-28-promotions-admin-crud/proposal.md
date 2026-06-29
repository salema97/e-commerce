# Propuesta: CRUD admin de promociones (fase 2)

## Intent

Operaciones debe poder crear y gestionar promociones, cupones y reglas mínimas desde `/admin/marketing` sin tocar la base de datos. Hoy solo pueden distribuir promos existentes y vincularlas a placements.

## Scope

### In Scope

- API REST admin bajo **`/v1/promotions`** (patrón suppliers/products): CRUD promoción, cupones anidados, reglas de descuento anidadas.
- Roles: `SUPER_ADMIN`, `ADMIN` en todas las mutaciones y listados admin.
- `@Audit` en create/update/delete de promotion, coupon, discount_rule.
- Mantener **`GET /v1/marketing/promotions`** como picker ligero (activas, id+name) para campañas y selectors de placements.
- Refactor del `PromotionsController` parcial (`marketing/promotions/admin/*` → `promotions/*`).
- Admin web:
  - Sub-nav: Campañas | **Promociones** | Popups y banners
  - Lista + form dialog (crear/editar campos base)
  - Página detalle `[id]` para cupones y reglas
- `api-client`: métodos + hooks + invalidación de queries.
- Tests: `promotions.controller.spec.ts` + ampliar service spec si hace falta.

### Out of Scope

- A/B testing, segmentación avanzada, personalización por usuario.
- Motor BUNDLE/TIERED completo (sigue simplificado en `PromotionService`).
- Selector producto/categoría en reglas más allá de UUID manual o autocomplete mínimo (fase 2.1 si no cabe en PR-3).
- Cambios en checkout mobile/web más allá de consumir cupones existentes.

## Capabilities

### New

- `promotions-admin`: API CRUD + UI admin.

### Modified

- `frontend`: marketing sub-nav, páginas promociones.
- `marketing-placements`: selector de promos se alimenta del picker existente (sin cambio de contrato).

## Approach

| PR | Alcance |
|----|---------|
| 1 API | Mover rutas a `@Controller('promotions')`, `@ApiTags('Promotions')`, controller spec, client + hooks, OpenAPI regen |
| 2 Admin lista | `requireMarketingAccess`, list view, promotion form dialog |
| 3 Admin detalle | `/promotions/[id]` cupones + reglas inline tables |

## Success Criteria

- [ ] Admin crea promoción PERCENTAGE con cupón `VERANO20`.
- [ ] Admin edita fechas y desactiva promoción.
- [ ] Admin añade regla `minimumAmount` en detalle.
- [ ] Picker campañas y placement-form siguen listando promos.
- [ ] Checkout sigue aplicando cupón vía `PromotionService`.
- [ ] Mutaciones generan `AuditLog`.

## Assumptions

- Rutas API sin `/admin/` en path (decisión de uniformidad acordada en revisión).
- Español en UI admin; artefactos SDD en español.
