# Proposal: Phase 8–10 UI Closure

## Problem

Phases 8 (finance), 9 (email/push/marketing), and 10 (AI/knowledge/CMS) were merged to `main` with API and partial admin UI, but several `api-client` endpoints lacked web/mobile surfaces and navigation links. SDD verify/archive were never completed.

## Solution

Close the three phases with three stacked PRs (≤400 lines each), wiring remaining UI, shared navigation, api-client hooks, seed data, and E2E fixes.

## Scope

| PR | Phase | Deliverable |
|----|-------|-------------|
| 1 | 8 | Finance UI gaps: expense receipt upload, account hub + store credit |
| 2 | 9 | Notifications/marketing: push PWA, marketing admin, mobile push lifecycle |
| 3 | 10 | AI/knowledge: `/help`, CMS legal/blog, knowledge admin, chat polish, seed |

## Out of scope

- Live SRI cer/production smoke
- Full VAPID/FCM production push setup
- Mobile FAQ screen (follow-up)

## Success criteria

- All three PRs merged to `main`
- `sdd-verify` PASS or PASS WITH WARNINGS
- `sdd-archive` completed for `phase-8-9-10-ui-closure`
