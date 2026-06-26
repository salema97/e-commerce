# Spec: Security & resilience

Archived from change `4r-remediation` (2026-06-26).

## Order access

- `GET /v1/orders/:id` and `POST /v1/orders/:id/cancel` require JWT ownership, staff role, or verified `guestEmail` for guest orders.
- Public tracking returns minimal fields only.

## Webhooks & secrets

- WMS webhooks reject when `WMS_WEBHOOK_SECRET` missing in production.
- Local env files must not be committed.

## Payment & catalog resilience

- Stripe webhooks confirm inventory before marking payment completed; duplicates replay confirm.
- Redis health uses PING.
- Catalog falls back to Prisma when Meilisearch fails; Redis cache errors are non-fatal.

## Local verification

- Run `pnpm test`, `pnpm test:e2e`, and `pnpm typecheck` before releases.
