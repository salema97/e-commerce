# Diseño: CRUD admin de promociones

## Enfoque técnico

Reutilizar `PromotionAdminService` existente. Refactorizar `PromotionsController` al patrón dominio estándar (`@Controller('promotions')`). Admin web bajo marketing con sub-nav y detalle anidado estilo products.

## Decisiones de arquitectura

| Decisión | Alternativas | Elección | Rationale |
|----------|--------------|----------|-----------|
| Prefijo API | `marketing/promotions/admin/*` | **`/v1/promotions`** | Alineado con suppliers/products; picker campañas queda en marketing |
| Tag Swagger | Marketing | **Promotions** | Dominio de descuentos separado de campañas email |
| Módulo Nest | NotificationsModule | **PromotionsModule** (actual) | `PromotionService` checkout + `PromotionsService` CRUD (patrón suppliers) |
| Listado campañas | Unificar con CRUD list | **`GET /marketing/promotions`** sin cambio | Respuesta ligera; evita romper `MarketingCampaignsView` |
| Auth page helper | Inline redirect | **`requireMarketingAccess()`** | Paridad con `requireFinanceAccess` |
| Detalle cupones/reglas | Todo en dialog | **Página `[id]`** | Paridad products; formularios no sobrecargan dialog |
| Hooks client | ops-hooks | **`promotion-hooks.ts`** o extensión `marketing-hooks` | Separar dominio promo CRUD de campañas; registrar en split-hooks |
| Delete promotion | Soft delete | **Hard delete** | Schema cascade coupons/rules; placements `SetNull` |

## API — rutas objetivo

```
GET    /v1/promotions              @Roles(ADMIN) — list (filtros isActive, type)
GET    /v1/promotions/:id          @Roles(ADMIN) — detail + coupons + discountRules
POST   /v1/promotions              @Audit promotion create
PATCH  /v1/promotions/:id          @Audit promotion update
DELETE /v1/promotions/:id          @Audit promotion delete

POST   /v1/promotions/:id/coupons           @Audit coupon create
PATCH  /v1/promotions/coupons/:couponId     @Audit coupon update
DELETE /v1/promotions/coupons/:couponId     @Audit coupon delete

POST   /v1/promotions/:id/rules             @Audit discount_rule create
PATCH  /v1/promotions/rules/:ruleId         @Audit discount_rule update
DELETE /v1/promotions/rules/:ruleId         @Audit discount_rule delete

GET    /v1/marketing/promotions    @Roles(ADMIN) — picker activas (sin cambio)
POST   /v1/marketing/campaigns/promo        — distribución (sin cambio)
```

**Orden de registro Nest:** rutas estáticas (`coupons/:id`, `rules/:id`) antes de `:id` si hiciera falta; con prefijos separados no hay colisión.

## Validación (service layer)

- `PERCENTAGE` / `FIXED_AMOUNT` → `value` requerido.
- `endsAt` > `startsAt` cuando ambos presentes.
- Cupón: código `trim().toUpperCase()`, único global.
- Regla: al menos uno de `minimumQuantity`, `minimumAmount`, `applicableProductId`, `applicableCategoryId` (validar en DTO).

## Web — estructura archivos

```
apps/web/src/
├── lib/marketing-page.ts              # requireMarketingAccess
├── components/admin/marketing-sub-nav.tsx  # + Promociones
└── app/admin/marketing/promotions/
    ├── page.tsx                       # SSR list
    ├── promotions-list-view.tsx
    ├── promotion-form.tsx             # dialog create/edit base fields
    └── [id]/
        ├── page.tsx                   # SSR detail
        └── promotion-detail-view.tsx  # coupons + rules tables
```

## api-client

```typescript
// client.ts — namespace promotions
promotions: {
  findAll: (query?) => GET /promotions
  findOne: (id) => GET /promotions/:id
  create / update / delete
  createCoupon / updateCoupon / deleteCoupon
  createRule / updateRule / deleteRule
}

// query-keys
promotions: (filters) => ['promotions', filters]
promotion: (id) => ['promotions', id]
```

Invalidación: `['promotions']` y `['marketing', 'promotions']` tras mutaciones.

## Migración del código parcial

1. Cambiar `@Controller('marketing/promotions')` → `@Controller('promotions')`.
2. Eliminar segmento `admin/` de cada ruta.
3. Renombrar tag a `Promotions`.
4. Añadir `promotions.controller.spec.ts` espejo de `marketing.controller.spec.ts`.

## RBAC

| Recurso | SUPER_ADMIN | ADMIN | Otros |
|---------|:-----------:|:-----:|:-----:|
| Promotions CRUD | ✅ | ✅ | ❌ |

Matriz AGENTS.md: marketing solo ADMIN roles. Backend es fuente de verdad; middleware web ya restringe `/admin/marketing/*`.
