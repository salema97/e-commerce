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

- [ ] 1.1 Web: expense receipt upload in admin expenses view
- [ ] 1.2 Web: finance sub-nav + account hub `/account` + store credit card
- [ ] 1.3 Shared: navbar/footer links to Mi cuenta
- [ ] 1.4 api-client: `useUploadExpenseReceipt` hook (if not on main)
- [ ] 1.5 Commit on `feat/phase-8-finance-ui-closure` and open PR

## Phase 2: Notifications & Marketing (PR 2)

- [ ] 2.1 API: `GET /v1/marketing/promotions`
- [ ] 2.2 Web: `/admin/marketing`, push opt-in, notification prefs polish
- [ ] 2.3 Mobile: push token register/remove on logout
- [ ] 2.4 api-client + shared-types marketing/push hooks
- [ ] 2.5 Commit on `feat/phase-9-notifications-ui-closure` and open PR

## Phase 3: AI & Knowledge (PR 3)

- [ ] 3.1 Web: `/help`, `/legal/*`, `/blog/*`, knowledge admin
- [ ] 3.2 Seed: CMS legal pages
- [ ] 3.3 Web: store chat widget polish, product AI edit hooks
- [ ] 3.4 E2E fixes (returns radio, support inbox selectors)
- [ ] 3.5 Commit on `feat/phase-10-ai-knowledge-ui-closure` and open PR

## Phase 4: Verification & Archive

- [ ] 4.1 Run typecheck + web unit + web e2e
- [ ] 4.2 Write `verify-report.md`
- [ ] 4.3 Archive change to `openspec/changes/archive/`
- [ ] 4.4 Close stale PR #1 (phase 8 already on main)
