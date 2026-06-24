# Infraestructura como código (referencia)

Este directorio documenta el despliegue reproducible. Para producción completa, migrar a Terraform/Pulumi según el proveedor.

## Archivos

| Archivo | Uso |
|---------|-----|
| `docker-compose.prod.yml` | Stack de referencia API + dependencias |
| `../docker-compose.yml` | Desarrollo local (Postgres, Redis, Meili, Evolution) |
| `../apps/api/Dockerfile` | Imagen API NestJS |

## Variables

Combinar `apps/api/.env.production.example` con secretos del proveedor (Railway, Render, Fly.io).

## Despliegue API (manual)

```bash
docker build -t ecommerce-api:latest -f apps/api/Dockerfile .
docker run --env-file apps/api/.env -p 3001:3001 ecommerce-api:latest
```

## Web (Vercel)

1. Conectar repo `apps/web` en Vercel.
2. Variables: `CLERK_*`, `API_BASE_URL`, `NEXT_PUBLIC_*`.
3. Deploy automático en push a `main` (workflow opcional en `.github/workflows/deploy-web.yml`).
