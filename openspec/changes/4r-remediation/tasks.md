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

## P1 — Testing

- [x] Tests unitarios order-access, actualizar e2e orders
- [x] Throttle en auth login/register/refresh
- [x] Throttler storage Redis
- [x] Swagger solo non-production

## P1 — Alta prioridad

- [x] WMS webhooks: secret obligatorio en producción
- [x] JWT web: token solo en httpOnly cookie + BFF `/api/v1/*` (sin accessToken en React state)
- [x] Auth tests: login, refresh rotation, logout, register conflict
- [x] Mobile tests: vitest + checkout estimate spec
- [x] Redis health PING
- [x] Rate limit Redis storage
- [x] Meilisearch runtime fallback
- [x] IVA vía `TaxService` (marketplace, quotes, promotions) + `ECUADOR_IVA_RATE` en calculadora
- [x] Circuit breakers cableados (Evolution, pagos locales, Stripe SDK, email, push, shipping, TaxJar, captcha)
- [x] Mobile checkout: cotización envío API (`shipping.quote`)

## Removido (sin CI en el proyecto)

- GitHub Actions workflows (`ci.yml`, `smoke.yml`, `deploy-web.yml`) eliminados por decisión del operador
- Flags `process.env.CI` / `forbidOnly` / `PLAYWRIGHT_FORCE_FRESH_SERVER` retirados de configs de test

## Deferido (P2 legibilidad / operacional)

- [ ] Split `packages/api-client/src/hooks.ts`
- [ ] Split `prisma/seed/index.ts` / `sri-queue.worker.ts`
- [ ] React Doctor 100/100 web
- [ ] JWT refresh en memoria móvil → secure-store audit
- [ ] Rotación manual de secretos expuestos en historial git
