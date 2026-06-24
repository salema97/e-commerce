# Backups PostgreSQL (PITR) y versionado R2

## PostgreSQL — PITR

### Objetivo
RPO **15 minutos** (ver `docs/runbooks/disaster-recovery.md`).

### Proveedores gestionados

| Proveedor | Acción |
|-----------|--------|
| Railway / Render / Supabase | Activar backups automáticos + PITR en panel |
| Self-hosted | `pg_basebackup` + WAL archiving a S3/R2 |

### Script de referencia (self-hosted)

```bash
#!/usr/bin/env bash
# scripts/ops/pg-backup.sh — ejecutar vía cron cada 6h
set -euo pipefail
TS=$(date +%Y%m%d-%H%M)
pg_dump "$DATABASE_URL" -Fc -f "backups/ecommerce-$TS.dump"
# Subir a R2/S3 con aws cli o rclone
```

## Cloudflare R2 — versionado de media

1. Bucket `ecommerce-media` → **Object versioning: Enabled**.
2. Lifecycle: expirar versiones no actuales después de 90 días (opcional).
3. Documentar `R2_BUCKET_NAME` y política de acceso firmado en `.env.production.example`.

## Verificación trimestral

- [ ] Restaurar dump en DB de staging
- [ ] Restaurar un objeto versionado desde R2
- [ ] Registrar tiempo real de RTO en runbook post-mortem
