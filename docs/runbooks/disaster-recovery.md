# Disaster Recovery — E-commerce Platform

## Objectives

| Metric | Target |
|--------|--------|
| **RPO** (Recovery Point Objective) | 15 minutes for PostgreSQL (PITR), 24h for object storage |
| **RTO** (Recovery Time Objective) | 4 hours full API restore, 1 hour web (Vercel redeploy) |

## Backups

- **PostgreSQL**: enable automated backups + PITR on managed provider (Railway/Render/Supabase). Daily snapshot retained 30 days.
- **Redis**: ephemeral cache/queues — rebuild from empty; replay domain events where needed.
- **R2 media**: enable bucket versioning; lifecycle policy for old versions.
- **Secrets**: store in provider secret manager; document rotation quarterly.

## Restore checklist

1. Provision new Postgres from latest PITR point.
2. Run `pnpm exec dotenv -e .env -- prisma migrate deploy` against restored DB.
3. Redeploy API container from tagged image.
4. Redeploy web from main branch (Vercel).
5. Verify health `/v1/health`, smoke checkout, SRI test invoice in cer environment.
6. Reconcile Stripe webhooks and Evolution API connection.

## Contacts

- On-call engineer: definir en PagerDuty/Opsgenie
- DBA / infra: definir contacto del proveedor cloud
