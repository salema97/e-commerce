# Delta for Frontend — Promotions Admin UI

## ADDED Requirements

### Requirement: Marketing promotions admin pages

The web app MUST expose promotion management under `/admin/marketing/promotions` accessible to `SUPER_ADMIN` and `ADMIN`.

The section MUST use `MarketingSubNav` with tab **Promociones** between Campañas and Popups y banners.

Access MUST use `requireMarketingAccess(path)` mirroring finance helpers.

#### Scenario: Unauthorized user redirected

- GIVEN a user with role FINANCE
- WHEN they navigate to `/admin/marketing/promotions`
- THEN they are redirected to sign-in or blocked by middleware

---

### Requirement: Promotions list view

The list page MUST:

1. SSR prefetch promotions via `getServerApiClient().promotions.findAll()`
2. Render table with name, type, value, active badge, date window, coupon count
3. Support filters `isActive` and `type`
4. Provide create/edit via dialog form (name, type, value, dates, isActive)
5. Link row to detail page `/admin/marketing/promotions/[id]`
6. Toggle `isActive` inline and delete with confirm

UI MUST follow `placements-list-view.tsx` patterns (`AnimatedPageShell`, `AdminPageHeader`, `neo-panel`, shadcn Table).

#### Scenario: Admin creates promotion from list

- GIVEN admin on promotions list
- WHEN they submit new PERCENTAGE promotion
- THEN table refreshes and promotion appears

---

### Requirement: Promotion detail page

Route `/admin/marketing/promotions/[id]` MUST:

1. SSR load full promotion with coupons and rules
2. Allow editing base fields (same as form)
3. Manage coupons: add (code, usageLimit, isActive), edit, delete
4. Manage discount rules: add (minimumAmount, minimumQuantity, product/category ids), edit, delete

Pattern reference: `admin/products/[id]` (dedicated page for nested data).

#### Scenario: Admin adds coupon on detail page

- GIVEN promotion detail open
- WHEN admin adds coupon `VERANO20`
- THEN coupon appears in table and is usable at checkout

---

### Requirement: api-client hooks

The client MUST provide React Query hooks:

- `usePromotions`, `usePromotion(id)`
- `useCreatePromotion`, `useUpdatePromotion`, `useDeletePromotion`
- `useCreateCoupon`, `useUpdateCoupon`, `useDeleteCoupon`
- `useCreateDiscountRule`, `useUpdateDiscountRule`, `useDeleteDiscountRule`

Mutations MUST invalidate `promotions` and `marketing.promotions` query keys.

#### Scenario: List refreshes after mutation

- GIVEN promotions list loaded
- WHEN admin toggles isActive
- THEN row reflects new state without full page reload
