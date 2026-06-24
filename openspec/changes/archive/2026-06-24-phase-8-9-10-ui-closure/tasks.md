# Tasks: Phase 8–10 UI Closure

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,200 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

## Phase 1: Finance UI (PR 1)

- [x] 1.1 Web: expense receipt upload in admin expenses view
- [x] 1.2 Web: finance sub-nav + account hub `/account` + store credit card
- [x] 1.3 Shared: navbar/footer links to Mi cuenta
- [x] 1.4 api-client: `useUploadExpenseReceipt` hook
- [x] 1.5 Commit on `feat/phase-8-finance-ui-closure` and open PR

## Phase 2: Notifications & Marketing (PR 2)

- [x] 2.1 API: `GET /v1/marketing/promotions`
- [x] 2.2 Web: `/admin/marketing`, push opt-in, notification prefs polish
- [x] 2.3 Mobile: push token register/remove on logout
- [x] 2.4 api-client + shared-types marketing/push hooks
- [x] 2.5 Commit on `feat/phase-9-notifications-ui-closure` and open PR

## Phase 3: AI & Knowledge (PR 3)

- [x] 3.1 Web: `/help`, `/legal/*`, `/blog/*`, knowledge admin
- [x] 3.2 Seed: CMS legal pages
- [x] 3.3 Web: store chat widget polish, product AI edit hooks
- [x] 3.4 E2E fixes (returns radio, support inbox selectors)
- [x] 3.5 Commit on `feat/phase-10-ai-knowledge-ui-closure` and open PR

## Phase 4: Verification & Archive

- [x] 4.1 Run typecheck + web unit + web e2e
- [x] 4.2 Write `verify-report.md`
- [x] 4.3 Archive change to `openspec/changes/archive/`
- [x] 4.4 Close stale PR #1 (phase 8 already on main)
