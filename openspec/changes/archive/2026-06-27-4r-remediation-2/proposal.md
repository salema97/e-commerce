# Proposal: 4R remediation round 2 (main, no PR)

## Context

Fresh 4R audit (2026-06-27) after Servientrega integration found remaining P0/P1 issues in transactions, inventory concurrency, webhook idempotency, SRI resilience, and security hardening.

## Scope

Single SDD apply on `main` — no PR. Fixes all BLOCKER/CRITICAL/WARNING from audit; P2 readability limited to seed UUID, vitest forbidOnly, admin nav helper, api-client query keys.

## Out of scope

- Split `hooks.ts` monolith (deferred)
- Distributed circuit breaker (Redis)
- Full order.paid consumer test suite
