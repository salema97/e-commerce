# Frontend — Phase 8–10 UI Closure (archived)

See `openspec/changes/archive/2026-06-24-phase-8-9-10-ui-closure/` for full SDD artifacts.

## Requirements

### Phase 8 finance UI parity

The web app MUST expose finance admin gaps and customer store-credit visibility.

#### Scenario: Admin uploads expense receipt
- GIVEN a finance user on `/admin/finance/expenses`
- WHEN they upload a receipt for an expense
- THEN the API `POST /v1/finance/expenses/:id/receipts` is called and the UI reflects success

#### Scenario: Customer views store credit on account hub
- GIVEN an authenticated customer with store credit
- WHEN they open `/account` via navbar
- THEN store credit balance is shown

### Phase 9 notifications and marketing UI parity

The web and mobile apps MUST wire push tokens and marketing distribution.

#### Scenario: Customer manages notification preferences
- GIVEN a signed-in customer
- WHEN they visit `/account/notifications`
- THEN email/push/marketing toggles persist via API

#### Scenario: Admin lists and distributes promotions
- GIVEN an admin on `/admin/marketing`
- WHEN the page loads
- THEN promotions list from API and distribute form is available

### Phase 10 AI and knowledge UI parity

The web app MUST expose public FAQ/CMS and admin knowledge management.

#### Scenario: Public FAQ page
- GIVEN published FAQs in seed
- WHEN a visitor opens `/help`
- THEN FAQs render in Spanish

#### Scenario: Public legal CMS page
- GIVEN CMS slug `politica-privacidad` in seed
- WHEN a visitor opens `/legal/privacy`
- THEN page content renders from CMS

#### Scenario: Admin manages FAQs and CMS
- GIVEN an admin user
- WHEN they open `/admin/knowledge`
- THEN FAQ and CMS CRUD views are reachable from sidebar

---

## Marketing placements consumption (archived)

See `openspec/changes/archive/2026-06-28-marketing-ui-popups/` for full SDD artifacts. API spec: `openspec/specs/marketing-placements/spec.md`.

### Web marketing placement provider

The web app MUST fetch active placements via `useActiveMarketingPlacements('WEB')` in `MarketingPlacementProvider`, defer `APP_LAUNCH` popups until cookie consent is stored, and render `HOME_HERO` / `STORE_TOP` / `STORE_INLINE` banners without consent gating.

#### Scenario: Popup waits for cookie consent
- GIVEN a first-time visitor with no stored consent
- WHEN an active APP_LAUNCH popup exists
- THEN the popup does NOT render until the cookie banner is dismissed

#### Scenario: Home hero banner from API
- GIVEN active BANNER placements for HOME_HERO
- WHEN a visitor opens `/`
- THEN banners render from API instead of hardcoded promo content

### Mobile marketing placement provider

The mobile app MUST fetch via `useActiveMarketingPlacements('MOBILE')`, gate APP_LAUNCH popups on analytics consent, and render placement slots on home/store tabs.

### Client dismiss and frequency

Dismiss keys: `marketing:dismissed:{placementId}:{contentVersion}` in localStorage (web) and AsyncStorage (mobile). `showOnceEver` and `showOncePerSession` flags MUST be honored; `contentVersion` bumps reset dismiss state.

### Accessibility

Web popups: focus trap, Escape to close, labelled dialog, return focus on close. Mobile: `accessibilityViewIsModal={true}`. At most one marketing popup visible at a time.

---

## Promotions admin UI (archived)

See `openspec/changes/archive/2026-06-28-promotions-admin-crud/`. API spec: `openspec/specs/promotions-admin/spec.md`.

### Admin promotions pages

`/admin/marketing/promotions` (list + dialog form) and `/admin/marketing/promotions/[id]` (cupones + reglas). Sub-nav: Campañas | Promociones | Popups y banners. Access via `requireMarketingAccess`.

#### Scenario: Admin creates promotion with coupon

- GIVEN admin on promotions detail
- WHEN they create a PERCENTAGE promotion and add coupon `VERANO20`
- THEN checkout can apply the coupon via `PromotionService`
