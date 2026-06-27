# Tasks: servientrega-ecuador-quotes

## Apply

- [x] SDD proposal, design, spec
- [x] Prisma `ServientregaCity` + migration
- [x] `ServientregaQuoteClient` + response util
- [x] `ServientregaCityService` + `ServientregaCitySyncService`
- [x] `ServientregaCarrierRateProvider`
- [x] Wire factory, module, env validation, `.env.example`
- [x] `POST /v1/shipping/servientrega/sync-cities` (admin)
- [x] Unit tests (client util, provider, city service)
- [x] `docs/ops/servientrega-integration.md`
- [x] verify-report.md

## Verify

- [x] `pnpm --filter @repo/api test`
- [x] `pnpm --filter @repo/api typecheck`

## Deferred

- [ ] SOAP guide generation (Fase 2)
- [ ] Tracking polling (Fase 2)
- [ ] Redis cache for quotes
- [ ] Product weight/dimensions schema fields
