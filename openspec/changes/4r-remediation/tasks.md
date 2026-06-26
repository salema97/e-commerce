# Tasks: 4r-remediation

## P0 — Seguridad

- [x] Untrack `apps/web/.env.local`; ampliar `.gitignore` para `**/.env.local`
- [x] Order access: `OrderAccessService` + authz GET/cancel
- [x] Tracking público sin cargar orden completa
- [x] WMS webhook: secret obligatorio en `NODE_ENV=production`

## P0 — Resiliencia

- [x] Stripe webhook: confirm inventario antes de COMPLETED + replay en duplicados
- [x] Redis health PING
- [x] Catálogo: fallback Meili runtime + cache tolerante a fallos Redis
- [x] `CircuitBreaker` util (base para integraciones externas)

## P1 — CI / testing

- [x] CI: `@repo/shared-utils test`, API e2e, vitest `forbidOnly` en CI
- [x] Tests unitarios order-access, actualizar e2e orders
- [x] Throttle en auth login/register/refresh
- [x] Throttler storage Redis
- [x] Swagger solo non-production

## P1 — DRY checkout

- [x] Constantes comercio en `@repo/shared-utils`; mobile + web checkout

## Deferido

- [ ] Split `packages/api-client/src/hooks.ts`
- [ ] Split `prisma/seed/index.ts` / `sri-queue.worker.ts`
- [ ] Playwright E2E completo en CI job principal
- [ ] React Doctor 100/100 web
- [ ] JWT refresh en memoria móvil → secure-store audit
