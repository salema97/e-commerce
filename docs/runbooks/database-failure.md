# Runbook: Database failure

## Symptoms

- API health check fails on DB probe
- Prisma connection errors in logs
- 5xx on all authenticated routes

## Immediate actions

1. Confirm outage scope (single instance vs cluster).
2. Check provider status page.
3. Fail over to read replica if configured; otherwise restore from PITR.

## Recovery

```bash
cd apps/api
pnpm exec dotenv -e .env -- prisma migrate deploy
pnpm exec prisma generate
```

4. Restart API workers (SRI queue, knowledge index).
5. Monitor error rate in Sentry for 30 minutes.

## Post-incident

- Document timeline and data loss window (RPO).
- Open ticket to review connection pool sizing and retry policies.
