# Delta for Frontend — Marketing Placements Consumption

## ADDED Requirements

### Requirement: Web marketing placement provider

The web app MUST fetch active placements via `useMarketingPlacementsActive('WEB')` inside a global `MarketingPlacementProvider` mounted from the root providers tree.

The provider MUST:

1. Hold resolved placements grouped by slot
2. Expose dismiss helpers that respect placement flags
3. Defer marketing `POPUP` display until cookie/analytics consent is resolved (consent banner dismissed or prior consent stored)
4. Render at most one `APP_LAUNCH` popup per session after gating

Banner and promo strip placements for `HOME_HERO`, `STORE_TOP`, and `STORE_INLINE` MUST NOT be blocked by consent gating (they are non-modal surfaces).

#### Scenario: Popup waits for cookie consent

- GIVEN a first-time visitor with no stored cookie consent
- WHEN an active APP_LAUNCH popup exists
- THEN the marketing popup does NOT render until `CookieConsentBanner` is dismissed or consent already exists

#### Scenario: Popup shows after consent

- GIVEN consent already stored in the browser
- WHEN the user loads the site and an active APP_LAUNCH popup exists
- THEN the popup renders on first eligible page load

#### Scenario: Home hero banner renders from API

- GIVEN active `BANNER` placements for `HOME_HERO`
- WHEN a visitor opens `/`
- THEN configured banners replace hardcoded promo hero content

#### Scenario: Store top strip renders from API

- GIVEN active `PROMO_STRIP` placements for `STORE_TOP`
- WHEN a visitor opens `/store`
- THEN promo strips render above the store catalog per priority order

---

### Requirement: Mobile marketing placement provider

The mobile app MUST fetch active placements via `useMarketingPlacementsActive('MOBILE')` in a provider mounted from `_layout.tsx` after the analytics consent flow.

Marketing `POPUP` for `APP_LAUNCH` MUST NOT display until `AnalyticsConsentBanner` is dismissed or consent is already persisted.

Home and store tab screens MUST render `HOME_HERO`, `STORE_TOP`, and `STORE_INLINE` placements from the provider.

#### Scenario: Mobile popup waits for analytics consent

- GIVEN a user who has not resolved analytics consent
- WHEN an active APP_LAUNCH popup exists
- THEN the marketing popup does NOT render over the consent overlay

#### Scenario: Mobile home banner from API

- GIVEN active banners for `HOME_HERO` on MOBILE or ALL
- WHEN the user opens the home tab
- THEN banners render from API data instead of hardcoded content

---

### Requirement: Client dismiss and frequency storage

Clients MUST persist dismiss state locally using keys scoped by placement id and `contentVersion`:

- Storage key pattern: `marketing:dismissed:{placementId}:{contentVersion}`
- Web: `localStorage`
- Mobile: `AsyncStorage` (dismiss flags are non-sensitive; MUST NOT use SecureStore for dismiss-only keys)

Behavior:

| Flag | Behavior |
|------|----------|
| `showOnceEver=true` | After dismiss, MUST NOT show again until `contentVersion` changes |
| `showOncePerSession=true` | After dismiss, MUST NOT show again until new browser/app session |
| Neither flag | Popup MAY reappear on each navigation until dismissed for current `contentVersion` |

Dismiss MUST be recorded when the user closes the popup via the dismiss control. CTA navigation MUST NOT auto-dismiss unless the UI explicitly includes close.

When `contentVersion` changes, prior dismiss keys for older versions MAY remain but MUST NOT suppress the new version.

#### Scenario: Show once ever persists across sessions

- GIVEN a popup with `showOnceEver=true` and `contentVersion=v1`
- WHEN the user dismisses it and returns later in a new session
- THEN the popup does NOT reappear

#### Scenario: Content version reset shows popup again

- GIVEN a user who dismissed popup version `v1`
- WHEN admin updates content and `contentVersion` becomes `v2`
- THEN the popup MAY display again

#### Scenario: Session-only dismiss resets on new session

- GIVEN a popup with `showOncePerSession=true`
- WHEN the user dismisses and starts a new session (web: new tab session; mobile: cold start)
- THEN the popup MAY display again

---

### Requirement: Accessibility and non-intrusive UX

Marketing popups MUST implement accessible modal behavior:

- **Web**: focus trap while open, `Escape` closes, `role="dialog"` with labelled title, return focus on close
- **Mobile**: `accessibilityViewIsModal={true}` on the popup container

Marketing popups MUST NOT render above consent modals (lower z-index / deferred mount until consent resolved).

At most one marketing popup MUST be visible at a time.

#### Scenario: Web popup closes with Escape

- GIVEN a visible marketing popup on web
- WHEN the user presses Escape
- THEN the popup closes and focus returns to the triggering context

#### Scenario: Single popup at a time

- GIVEN two eligible APP_LAUNCH popups in API response (should not happen server-side)
- WHEN the client resolves placements
- THEN only the highest-priority popup is shown

---

### Requirement: CTA navigation

When `ctaHref` is present, clients MUST navigate internally for app routes or open external URLs in a new tab (web) / in-app browser or system browser (mobile) for http(s) links.

When only `promotionId` is set, clients SHOULD navigate to store or checkout with promotion context as defined in design (e.g. pre-filled coupon field); MUST NOT attempt to apply discounts client-side.

Deep links on mobile MUST be validated against an allowlist of internal route prefixes; invalid hrefs MUST be ignored and logged.

#### Scenario: Internal product link navigates

- GIVEN a banner with `ctaHref=/store/products/slug-abc`
- WHEN the user taps the CTA on web
- THEN the router navigates to the product page

#### Scenario: Invalid mobile deep link is safe

- GIVEN a placement with `ctaHref` outside the allowlist
- WHEN the user taps CTA on mobile
- THEN navigation does not occur and no crash is thrown

---

### Requirement: PR-3 acceptance (Web slice)

PR-3 is complete when ALL of the following hold:

1. `MarketingPlacementProvider` integrated in web providers
2. APP_LAUNCH popup with consent gating and dismiss logic works
3. `/` renders `HOME_HERO` banners/strips from API
4. `/store` renders `STORE_TOP` and `STORE_INLINE` placements from API
5. Accessibility requirements for web popup are met
6. PR diff stays within the 400-line review budget

#### Scenario: End-to-end web demo

- GIVEN seeded placements and PR-1 + PR-2 merged
- WHEN a visitor completes cookie consent on `/`
- THEN launch popup and home banner content match admin configuration

---

### Requirement: PR-4 acceptance (Mobile slice)

PR-4 is complete when ALL of the following hold:

1. Provider mounted post-consent in `_layout.tsx`
2. APP_LAUNCH popup with consent gating and dismiss logic works
3. Home tab renders `HOME_HERO` placements
4. Store tab renders `STORE_TOP` / `STORE_INLINE` placements
5. Mobile accessibility (`accessibilityViewIsModal`) is implemented
6. PR diff stays within the 400-line review budget

#### Scenario: End-to-end mobile demo

- GIVEN seeded placements and PR-1 through PR-3 merged
- WHEN the user resolves analytics consent and opens the home tab
- THEN configured banners and launch popup match admin configuration
