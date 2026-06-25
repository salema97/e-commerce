# Cloudflare WAF y DDoS (configuración infra)

La API y la web deben ir detrás de Cloudflare en producción.

## Checklist

1. DNS proxied (nube naranja) para `tienda.example.com` y `api.example.com`.
2. **SSL/TLS**: Full (strict); certificado origin en API.
3. **WAF managed rules**: OWASP Core Ruleset activo.
4. **Rate limiting** (complementa NestJS Throttler):
   - `/v1/webhooks/*` — 30 req/min por IP
   - `/v1/auth/*` — 20 req/min por IP
5. **Bot Fight Mode** o Super Bot Fight en plan Business+.
6. Page Rules / Cache Rules: cachear estáticos; bypass en `/v1/*`.

## Headers

Next.js ya envía CSP/HSTS; Cloudflare puede añadir `X-Content-Type-Options` duplicado — sin conflicto.
