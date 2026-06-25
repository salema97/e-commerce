# Stripe Radar y MFA admin (configuración externa)

## Stripe Radar

1. Dashboard Stripe → **Radar** → activar reglas por defecto.
2. Bloquear tarjetas de alto riesgo en checkout (`payment_intent` con `radar_options`).
3. Revisar disputas semanalmente; enlazar con `Refund` / `ReturnRequest` en admin.

No requiere cambios de código para el MVP; opcional: webhook `radar.early_fraud_warning`.

## MFA para administradores (JWT nativo)

1. Panel admin → **Configuración** → **Seguridad** → activar MFA obligatorio para roles `admin` y `super_admin`.
2. Política: TOTP (app autenticadora) o códigos de respaldo; sesiones con `mfaVerified` en el JWT.
3. Verificar que `/admin` sigue protegido por middleware + claim de rol en JWT.

## Pentest pre-lanzamiento

Contratar pentest externo o bug bounty; usar checklist OWASP ASVS nivel 2 como guía interna.
