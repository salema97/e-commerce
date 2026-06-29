# Tasks: 4r-remediation-2

## P0 Reliability

- [x] `applyPaymentResult` in `$transaction`
- [x] Inventory atomic reserve (conditional UPDATE)
- [x] `releaseItems` + createOrder compensation
- [x] `cancelOrder` + `releaseExpiredReservations` atomic

## P0 Resilience

- [x] Stripe webhook Redis idempotency claim
- [x] SRI `submit()` circuit breaker + retry

## P1 Risk

- [x] WMS `timingSafeEqual`
- [x] `E2E_RELAX_THROTTLE` env validation
- [x] Cookie `secure` for staging HTTPS
- [x] Chat GET throttle

## P1 Ops

- [x] Meilisearch health indicator
- [x] `resilientFetchWithRetry` for local payment providers
- [x] `getProviderSecret` throw on unknown provider
- [x] `vitest` forbidOnly

## P2 Readability

- [x] Seed FAQ UUID dedupe
- [x] `isNavItemActive` helper
- [x] api-client inline query keys → `queryKeys`

## Deferido

- [x] Split `hooks.ts` → 16 domain modules + `query-keys.ts`
- [x] Distributed circuit breaker (Redis-backed via `DistributedCircuitBreaker`)
- [x] order.paid consumer tests (dropship, engagement, seller, notifications)
