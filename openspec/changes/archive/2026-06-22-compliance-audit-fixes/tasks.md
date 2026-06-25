# Tasks: Compliance audit fixes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900 |
| Chained PRs | 8 (merged) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

## PR 1 — Privacy JWT native

- [x] 1.1 SDD spec `specs/api-privacy/spec.md`
- [x] 1.2 Fix `privacy.service` + controller + spec tests
- [x] 1.3 `pnpm install` + typecheck API
- [x] 1.4 verify-report + commit + PR #7 + merge

## PR 2 — B2B pricing module

- [x] 2.1 Extract `B2bPricingModule`
- [x] 2.2 Quotes imports pricing module only
- [x] 2.3 health:api sin error circular
- [x] 2.4 verify + PR #8 + merge

## PR 3 — POS catch

- [x] 3.1 void + error handling en `pos.service`
- [x] 3.2 verify + PR #9 + merge

## PR 4 — Account SSR

- [x] 4.1 loyalty/referrals server pages + client views
- [x] 4.2 typecheck web
- [x] 4.3 verify + PR #10 + merge

## PR 5 — Admin referrals header

- [x] 5.1 Refactor referrals admin panel
- [x] 5.2 verify + PR #11 + merge

## PR 6 — Docs ops

- [x] 6.1 Actualizar 5 docs Clerk→JWT
- [x] 6.2 verify + PR #12 + merge

## PR 7 — Web a11y

- [x] 7.1 B2B labels, cookie dialog, footer role
- [x] 7.2 health:web 89/100 (target ≥95 deferred: checkout giant component)
- [x] 7.3 verify + PR #13 + merge

## PR 8 — Mobile + seed

- [x] 8.1 `account/subscriptions` mobile
- [x] 8.2 Seed ubicación POS demo
- [x] 8.3 verify + PR #14 + merge

## Archive

- [x] A.1 Archive change to `openspec/changes/archive/`
