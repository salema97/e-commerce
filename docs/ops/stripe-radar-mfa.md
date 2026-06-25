# Stripe Radar y MFA admin (configuración externa)

## Stripe Radar

1. Dashboard Stripe → **Radar** → activar reglas por defecto.
2. Bloquear tarjetas de alto riesgo en checkout (`payment_intent` con `radar_options`).
3. Revisar disputas semanalmente; enlazar con `Refund` / `ReturnRequest` en admin.

No requiere cambios de código para el MVP; opcional: webhook `radar.early_fraud_warning`.

## MFA para administradores (Clerk)

1. Clerk Dashboard → **User & Authentication** → **Multi-factor**.
2. Política: obligatorio para roles `admin` y `super_admin` vía **Organization** o **Session tasks**.
3. Verificar que `/admin` sigue protegido por middleware + JWT role.

## Pentest pre-lanzamiento

Contratar pentest externo o bug bounty; usar checklist OWASP ASVS nivel 2 como guía interna.
