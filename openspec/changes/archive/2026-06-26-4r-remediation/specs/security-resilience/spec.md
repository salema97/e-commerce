# Spec: Security & resilience (4R remediation)

## Requirements

### REQ-SEC-01 Order read authorization

`GET /v1/orders/:id` MUST NOT return order PII without verified caller identity.

- Authenticated staff roles MAY read any order.
- Authenticated customer MUST only read orders where `order.userId` matches JWT subject.
- Guest orders (`userId` null) MAY be read when `guestEmail` matches `order.customerEmail`.
- Unauthenticated requests without valid guest email MUST return 401.

### REQ-SEC-02 Order cancel authorization

`POST /v1/orders/:id/cancel` MUST enforce the same ownership rules as REQ-SEC-01.

### REQ-SEC-03 Public tracking minimal payload

`GET /v1/orders/:id/tracking` MUST return only status, orderNumber, and shipment tracking fields — not full customer PII.

### REQ-SEC-04 WMS webhook secret

When `NODE_ENV=production`, WMS webhooks MUST reject requests if `WMS_WEBHOOK_SECRET` is unset or signature invalid.

### REQ-SEC-05 Secrets not in git

Local env files with secrets MUST NOT be tracked; `.gitignore` MUST cover `**/.env.local`.

### REQ-RES-01 Stripe payment side effects

Payment confirmation MUST confirm inventory reservations before marking payment `COMPLETED`. Duplicate webhook events MUST re-attempt inventory confirm if needed.

### REQ-RES-02 Redis health

Health check MUST verify Redis connectivity via PING, not only env presence.

### REQ-RES-03 Catalog degradation

Catalog browse MUST fall back to Prisma when Meilisearch errors at runtime. Redis cache failures MUST NOT fail the request.

### REQ-CI-01 CI coverage

CI MUST run API e2e tests, shared-utils unit tests, and forbid `.only` in vitest when `CI=true`.
