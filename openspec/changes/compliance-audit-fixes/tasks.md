# Tasks: Compliance audit fixes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900 |
| Chained PRs | 8 |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

## PR 1 — Privacy JWT native

- [x] 1.1 SDD spec `specs/api-privacy/spec.md`
- [x] 1.2 Fix `privacy.service` + controller + spec tests
- [x] 1.3 `pnpm install` + typecheck API
- [ ] 1.4 verify-report + commit + PR + merge

## PR 2 — B2B pricing module

- [x] 2.1 Extract `B2bPricingModule`
- [x] 2.2 Quotes imports pricing module only
- [x] 2.3 health:api sin error circular
- [ ] 2.4 verify + PR + merge

## PR 3 — POS catch

- [ ] 3.1 void + error handling en `pos.service`
- [ ] 3.2 verify + PR + merge

## PR 4 — Account SSR

- [ ] 4.1 loyalty/referrals server pages + client views
- [ ] 4.2 typecheck web
- [ ] 4.3 verify + PR + merge

## PR 5 — Admin referrals header

- [ ] 5.1 Refactor referrals admin panel
- [ ] 5.2 verify + PR + merge

## PR 6 — Docs ops

- [ ] 6.1 Actualizar 4 docs Clerk→JWT
- [ ] 6.2 verify + PR + merge

## PR 7 — Web a11y

- [ ] 7.1 B2B labels, cookie dialog, footer role
- [ ] 7.2 health:web ≥95
- [ ] 7.3 verify + PR + merge

## PR 8 — Mobile + seed

- [ ] 8.1 `account/subscriptions` mobile
- [ ] 8.2 Seed ubicación POS demo
- [ ] 8.3 verify + PR + merge

## Archive

- [ ] A.1 Archive change to `openspec/changes/archive/`
