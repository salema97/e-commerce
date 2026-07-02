# SRI production checklist (Ecuador launch)

Use this checklist before switching from SRI **test** (`celcer`) to **production** (`cel`).

## Credentials and certificates

- [ ] Valid **RUC** registered with SRI for the operating company.
- [ ] **Digital certificate** (`.p12`) from an SRI-approved CA, not expired.
- [ ] **Establishment** and **emission point** codes authorized for document types 01, 04, 05, 06, 07 as required.
- [ ] **Authorized invoice sequences** loaded in Prisma (`InvoiceSequence`) matching SRI authorization ranges.

## Environment variables (`apps/api/.env`)

```bash
SRI_RUC=xxxxxxxxxxxx
SRI_DIGITAL_CERTIFICATE_PATH=/secure/path/cert.p12
SRI_DIGITAL_CERTIFICATE_PASSWORD=********
SRI_ESTABLISHMENT_CODE=001
SRI_EMISSION_POINT_CODE=001
SRI_TEST_ENVIRONMENT=false
```

- [ ] `SRI_TEST_ENVIRONMENT=false` for production SOAP endpoints.
- [ ] Certificate file mounted on the API host with restrictive filesystem permissions (not in git, not in Docker image layers).
- [ ] Secrets validated at boot (Zod in `env.validation.ts`).

## Smoke verification

1. **Local/dev certificate smoke** (test environment):

   ```bash
   pnpm --filter @repo/api build
   pnpm --filter @repo/api sri:smoke
   ```

2. **Staging with production cert** (recommended): issue one real low-value order end-to-end and confirm:
   - [ ] Invoice status `AUTHORIZED` in admin `/admin/invoices`.
   - [ ] RIDE PDF + XML delivered by email/WhatsApp.
   - [ ] Access key (`clave de acceso`) stored in Prisma.

3. **Credit note (04)** on a test return in staging before go-live.

## Operations

- [ ] Run `pnpm prelaunch:ec` (dependency audit + Playwright smoke).
- [ ] Monitor SRI queue failures (`SriQueueService`) and set alerts on repeated `REJECTED` / `FAILED`.
- [ ] Document rollback: if SRI is down, pause checkout or queue invoices — never block payment capture without a retry policy.

## Related docs

- [`AGENTS.md`](../AGENTS.md) — SRI SOAP endpoints and document types.
- [`apps/api/scripts/sri-dev-smoke.ts`](../apps/api/scripts/sri-dev-smoke.ts) — dev smoke script.
- [`docs/ops/backup-pitr-r2.md`](./backup-pitr-r2.md) — backup RPO/RTO for invoice XML/PDF storage.
