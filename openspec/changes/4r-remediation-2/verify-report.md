# Verify report: 4r-remediation-2

Date: 2026-06-27

## Commands

| Check | Result |
|-------|--------|
| `pnpm --filter @repo/api test` | PASS (409) |

## Applied

- Payment webhooks: `$transaction` in `applyPaymentResult`; unknown provider secret throws
- Inventory: atomic `UPDATE` reserve; `releaseItems` compensation on order create failure; atomic cancel/expiry
- Stripe webhook: Redis idempotency `claim` at ingress
- SRI SOAP: circuit breaker + retry on `submit()`
- WMS: `timingSafeEqual`
- Throttle: `E2E_RELAX_THROTTLE` in env schema; blocked in production; ConfigService in guard
- Web cookies: `secure` for staging/preview HTTPS
- Chat GET: `@Throttle` 20/min
- Health: Meilisearch indicator
- Local payments: `resilientFetchWithRetry`
- Seed: unique `faqShipping` UUID
- api-client: centralized query keys; `isNavItemActive` helper
- vitest: `forbidOnly` when `CI` set

## Deferred

- Split `hooks.ts` monolith
- Distributed circuit breaker
- order.paid consumer test suite
