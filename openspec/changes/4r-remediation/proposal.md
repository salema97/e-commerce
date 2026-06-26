# Proposal: Remediación auditoría 4R (single PR)

## Problem

La revisión 4R (risk, readability, reliability, resilience) del monorepo detectó hallazgos bloqueantes: secretos trackeados en git, IDOR en órdenes, webhooks WMS sin secret en producción, idempotencia rota en Stripe webhook (inventario), health Redis sin PING, catálogo sin fallback Meili en runtime, rate limit in-memory, y Swagger expuesto sin guard de entorno.

## Solution

Un único change SDD `4r-remediation` con pipeline completo (propose → spec → design → tasks → apply → verify → archive) entregado en **un solo PR** hacia `main`, priorizando P0/P1 de seguridad y resiliencia. Refactors de legibilidad (monolitos) y mejoras P2 quedan documentadas como deferidas en `tasks.md`.

## Success criteria

- `pnpm typecheck` verde
- `pnpm --filter @repo/api test` y `test:e2e` verdes
- `pnpm --filter @repo/shared-utils test` verde
- Sin `.env.local` trackeado; `.gitignore` cubre env locales
- GET/cancel órdenes exigen ownership o email invitado verificado
- Stripe webhook confirma inventario antes de marcar pago completado; replays re-ejecutan confirm
- Redis health hace PING real
- Catálogo tolera fallos Meili/Redis cache
- WMS webhook rechaza requests si falta secret en producción
- Throttle auth + storage Redis; Swagger solo non-prod
- `verify-report.md` y specs archivadas en `openspec/specs/`
