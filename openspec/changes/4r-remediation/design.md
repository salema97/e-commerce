# Design: Remediación 4R

## Order access control

Patrón alineado con `InvoicesService.assertInvoiceAccess`:

- Contexto de acceso: JWT (`userId`, `role`) **o** `guestEmail` para órdenes sin `userId`.
- Staff (`SUPER_ADMIN`, `ADMIN`, `FINANCE`, `SUPPORT`, `INVENTORY`) accede a cualquier orden.
- `CUSTOMER` con JWT solo ve órdenes donde `order.userId === userId`.
- Invitado: `guestEmail` (query en GET, body en cancel) debe coincidir con `order.customerEmail` (case-insensitive).
- Sin credenciales válidas → `401`; credenciales inválidas para la orden → `403`.
- Tracking público (`GET :id/tracking`) consulta Prisma con `select` mínimo (sin PII de cliente).

`OrderAccessService` centraliza parseo de `Authorization` + validación.

## Stripe webhook idempotency

Orden de efectos en `confirmOrderPayment`:

1. `reservationService.confirm(orderId)` — falla → excepción → Stripe reintenta con pago aún `PENDING`.
2. Transacción Prisma: payment `COMPLETED`, order `PROCESSING`.
3. `recordWebhookProcessed` + audit + eventos.

En rutas duplicate (`payment.status === COMPLETED`), invocar `ensurePostPaymentSideEffects` antes de registrar duplicado para reparar estados inconsistentes históricos.

## Resiliencia catálogo

- `browseUncached`: try/catch en búsqueda Meili → fallback `browseWithPrisma`.
- `CatalogCacheService.get/set/invalidate`: try/catch → miss/set no-op/log; browse sigue funcionando.

## Redis throttle + health

- `RedisThrottlerStorage` implementa `ThrottlerStorage` con INCR/PEXPIRE.
- `RedisHealthIndicator` inyecta `RedisService` y ejecuta `PING`.

## Deferido (P2+)

- Split de monolitos (`hooks.ts`, seed, sri-queue).
- Circuit breaker en Evolution (ya tiene retry exponencial; breaker genérico añadido como util reutilizable).
- Playwright full suite local (`pnpm --filter @repo/web test:e2e`).
