# Proposal: Compliance audit fixes (post Phase 17)

## Problem

Auditoría contra `docs/*.md` detectó regresiones vs baseline documentado: privacy API rota (Clerk legacy), typecheck API fallando, dependencia circular B2b↔Quotes, deuda SSR admin/cuenta, docs ops desactualizados, React Doctor web 81/100.

## Solution

Ocho PRs encadenados (≤400 líneas c/u), cada uno con SDD verify antes de merge a `main`.

## Scope

| PR | Branch | Deliverable |
|----|--------|-------------|
| 1 | `fix/privacy-jwt-native` | `ensureByUserId`, mensajes sin Clerk, typecheck API |
| 2 | `fix/b2b-pricing-module` | Romper ciclo B2bModule↔QuotesModule |
| 3 | `fix/pos-invoice-catch` | `void` explícito en catch async POS |
| 4 | `fix/account-loyalty-referrals-ssr` | SSR + `AnimatedPageShell` cuenta |
| 5 | `fix/admin-referrals-header` | `AdminPageHeader` en referidos admin |
| 6 | `docs/ops-jwt-native` | Actualizar docs ops/compliance (sin Clerk runtime) |
| 7 | `fix/web-a11y-doctor` | Labels B2B, dialog cookies, footer role |
| 8 | `feat/mobile-subscriptions-pos-seed` | Pantalla suscripciones móvil + seed POS |

## Success criteria

- `pnpm typecheck` verde
- `pnpm health` web/api/mobile sin errores críticos
- Tests API/web sin regresión
- Cada PR con `verify-report.md` y merge a `main`
