# Evolution API en producción

El servicio ya está definido en `docker-compose.yml` para desarrollo.

## Producción (VPS / contenedor dedicado)

```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY="$EVOLUTION_API_KEY" \
  -e SERVER_URL="https://whatsapp-api.example.com" \
  -e WEBHOOK_GLOBAL_URL="https://api.example.com/v1/webhooks/evolution" \
  -e WEBHOOK_GLOBAL_ENABLED=true \
  -v evolution-data:/evolution/storage \
  atendai/evolution-api:latest
```

## API e-commerce

- `EVOLUTION_API_URL` → URL pública del servicio
- `EVOLUTION_WEBHOOK_SECRET` → validar firma en `WebhooksModule`
- Firewall: solo la API y IPs de confianza pueden alcanzar el puerto 8080

## Escalado

Para volumen alto, migrar a **WhatsApp Cloud API** (ver AGENTS.md).
