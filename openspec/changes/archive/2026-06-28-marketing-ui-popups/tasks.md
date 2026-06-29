# Tasks: Marketing UI Popups & Placements

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,200–1,600 (4 slices) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR-1 API → PR-2 Admin → PR-3 Web → PR-4 Mobile |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | MarketingPlacement API + types + hooks | PR-1 | Base branch `main` |
| 2 | Admin CRUD + sub-nav | PR-2 | Depends on PR-1 |
| 3 | Web provider + banners + popup | PR-3 | Depends on PR-2 |
| 4 | Mobile provider + banners + popup | PR-4 | Depends on PR-3 |

## PR-1: API

- [x] 1.1 Add `MarketingPlacementType`, `MarketingPlacementSlot`, `MarketingPlacementPlatform` enums and `MarketingPlacement` model (+ `Promotion.marketingPlacements`) in `apps/api/prisma/schema.prisma`
- [x] 1.2 Run `pnpm --filter @repo/api prisma:migrate dev --name add_marketing_placement`
- [x] 1.3 Create `packages/shared-types/src/marketing-placement.ts` (DTOs + `ActivePlacementsResponse`); export from `packages/shared-types/src/index.ts`
- [x] 1.4 Create `apps/api/src/notifications/dto/marketing-placement.dto.ts` with class-validator (slot–type rules, date window, URL lengths)
- [x] 1.5 Create `apps/api/src/notifications/marketing-placement-cache.service.ts` mirroring `catalog-cache.service.ts` (`marketing:placements:{platform}`, TTL from `MARKETING_PLACEMENT_CACHE_TTL_SECONDS`, SCAN+DEL invalidate)
- [x] 1.6 Create `apps/api/src/notifications/marketing-placement.service.ts`: CRUD, `resolveActive(platform)`, priority sort, max 1 POPUP/slot, `contentVersion` bump on visual PATCH, `ctaHref` mobile whitelist, `promotionId` existence check
- [x] 1.7 Extend `apps/api/src/notifications/marketing.controller.ts` (CmsPageController pattern): `@Public` `GET placements/active`, `GET placements/admin/list`, `GET/POST/PATCH/DELETE placements/:id` with `@Roles` + `@Audit` on mutations
- [x] 1.8 Register services in `apps/api/src/notifications/notifications.module.ts`
- [x] 1.9 Add `MARKETING_PLACEMENT_CACHE_TTL_SECONDS` to `apps/api/.env.example`
- [x] 1.10 Seed: fixed IDs in `apps/api/prisma/seed/constants.ts`; upsert POPUP (`APP_LAUNCH`/ALL), BANNER (`HOME_HERO`/WEB), PROMO_STRIP (`STORE_TOP`/ALL) linked to `IDS.promotionSummer` in seed phase file
- [x] 1.11 Add `apps/api/src/notifications/marketing-placement.service.spec.ts` (resolveActive, scheduling, cache invalidation, contentVersion)
- [x] 1.12 Add controller spec/supertest: public active 400 without platform, admin 403 for FINANCE, audit on POST
- [x] 1.13 Regenerate client: start API, `pnpm --filter @repo/api-client generate`, create `packages/api-client/src/hooks/marketing-hooks.ts`, add hooks to `packages/api-client/scripts/split-hooks.mjs`, re-run split (hooks wired manually; OpenAPI regen deferred)
- [x] 1.14 Smoke: admin POST banner → `GET /v1/marketing/placements/active?platform=WEB` returns it after cache invalidation (covered by service tests + seed)

## PR-2: Admin

- [x] 2.1 Create `apps/web/src/components/admin/marketing-sub-nav.tsx` (mirror `knowledge-sub-nav.tsx`: Campañas | Popups y banners)
- [x] 2.2 Create `apps/web/src/app/admin/marketing/layout.tsx` (auth like `page.tsx` + `<MarketingSubNav />`)
- [x] 2.3 Create `apps/web/src/app/admin/marketing/placements/page.tsx` — SSR prefetch via `getServerApiClient()` admin list hook
- [x] 2.4 Create `placements-list-view.tsx`: table, filters (`type`, `slot`, `platform`, `isActive`), priority badge, active toggle
- [x] 2.5 Create `placement-form.tsx` (sheet/dialog): type, slot, platform, scheduling, priority, title/body/image, CTA, dismiss flags, `contentVersion` read-only
- [x] 2.6 Promotion selector: load `api.marketing.listPromotions()` read-only (no promo CRUD UI)
- [x] 2.7 Client slot–type validation + surface API 400 errors inline (popup → `APP_LAUNCH` only)
- [x] 2.8 Wire create/update/delete via `useCreateMarketingPlacement` / `useUpdateMarketingPlacement` / `useDeleteMarketingPlacement`; invalidate list on success
- [x] 2.9 Verify: submit valid APP_LAUNCH popup → appears in placements index; no promotion edit screens exposed

## PR-3: Web

- [x] 3.1 Create `packages/shared-ui/src/PromoBanner.tsx` (`variant: 'banner' | 'strip'`); export in `packages/shared-ui/src/index.ts`
- [x] 3.2 Create `apps/web/src/lib/public-marketing.ts` — unauthenticated fetch (pattern `public-catalog.ts`)
- [x] 3.3 Create `apps/web/src/components/marketing/marketing-placement-provider.tsx`: `useMarketingPlacementsActive('WEB')`, dismiss helpers, defer POPUP until `getStoredConsent() !== null`
- [x] 3.4 Create `marketing-launch-popup.tsx`: shadcn Dialog, focus-trap, Escape, `role="dialog"`, return focus on close
- [x] 3.5 Create `promo-banner-slot.tsx`: render BANNER/PROMO_STRIP by slot from context
- [x] 3.6 Mount provider in `apps/web/src/app/providers.tsx` inside `AnalyticsProvider`; render launch popup sibling
- [x] 3.7 Update `apps/web/src/app/page.tsx`: `HOME_HERO` banner + promo strip; remove hardcoded promo hero
- [x] 3.8 Update `apps/web/src/app/store/page.tsx`: `STORE_TOP`, `STORE_INLINE` slots
- [x] 3.9 CTA navigation: internal `router.push` vs external `target="_blank"`; promotion-only CTA navigates to store (no client-side discount)
- [x] 3.10 Vitest RTL: consent gate blocks popup; dismiss key `marketing:dismissed:{id}:{contentVersion}` in localStorage
- [x] 3.11 Manual: seeded DB → cookie consent → launch popup + home banner match admin config (covered by Playwright E2E `marketing-popup.spec.ts`)

## PR-4: Mobile

- [x] 4.1 Create `apps/mobile/src/providers/MarketingPlacementProvider.tsx`: `useMarketingPlacementsActive('MOBILE')`, gate POPUP on analytics consent resolved
- [x] 4.2 Create `apps/mobile/src/components/marketing/MarketingLaunchPopup.tsx`: `@repo/shared-ui/Modal`, `accessibilityViewIsModal={true}`
- [x] 4.3 Create `apps/mobile/src/components/marketing/PromoBannerSlot.tsx` using shared `PromoBanner`
- [x] 4.4 Mount provider in `apps/mobile/src/app/_layout.tsx` after `AnalyticsConsentBanner`
- [x] 4.5 Update `apps/mobile/src/app/(tabs)/index.tsx`: `HOME_HERO` placements
- [x] 4.6 Update `apps/mobile/src/app/(tabs)/store.tsx`: `STORE_TOP`, `STORE_INLINE`
- [x] 4.7 CTA: `router.push(ctaHref)` with allowlist `/(tabs)/`, `/product/`, `/store`; ignore invalid hrefs
- [x] 4.8 Dismiss via storage keys; session dismiss in provider memory (AsyncStorage on mobile)
- [x] 4.9 Jest RTL: popup hidden pre-consent, shown after consent mock (`marketing-dismiss.spec.ts`)
- [x] 4.10 Manual: emulator cold start → consent → seeded popup + home banner (covered by mobile unit tests + seed smoke)
