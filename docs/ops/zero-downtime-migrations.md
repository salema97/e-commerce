# Estrategia de migraciones sin downtime

## Principios

1. **Migraciones expand/contract**: primero añadir columnas/tablas compatibles; luego desplegar código; luego eliminar lo obsoleto en migración posterior.
2. **Sin locks largos**: evitar `ALTER` bloqueantes en tablas calientes (`Order`, `Product`, `Inventory`) en horario pico.
3. **Orden de deploy**: `prisma migrate deploy` → esperar health OK → tráfico al nuevo pod.

## Flujo recomendado (API)

```bash
# 1. Backup/PITR point antes de migrar (ver backup-pitr-r2.md)
# 2. Migrar
cd apps/api
pnpm exec dotenv -e .env -- prisma migrate deploy
pnpm exec prisma generate

# 3. Rolling deploy (Kubernetes / Railway / Render)
# - maxUnavailable: 0
# - readiness: GET /v1/health

# 4. Verificar
curl -f "$API_URL/v1/health"
```

## Migraciones peligrosas

| Tipo | Mitigación |
|------|------------|
| `NOT NULL` sin default | backfill en migración SQL + default temporal |
| Rename columna | vista o columna nueva + dual-write |
| Índice grande | `CREATE INDEX CONCURRENTLY` en SQL manual |
| Enum nuevo valor | deploy API que lo entienda antes de usarlo |

## Rollback

- **Código**: revertir imagen/tag anterior.
- **Schema**: no hacer `migrate reset` en prod; crear migración forward-fix.
