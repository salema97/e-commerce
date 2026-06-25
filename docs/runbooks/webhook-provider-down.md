# Runbook: Webhook provider down

## Affected providers

- Stripe (`/v1/webhooks/stripe`)
- Auth session webhooks (si aplica proveedor externo de identidad)
- Evolution API (WhatsApp)
- Local payment providers (Kushki, PayPhone, etc.)

## Symptoms

- Orders stuck in pending payment
- Missing user role sync
- WhatsApp messages not delivered

## Immediate actions

1. Check provider status dashboard.
2. Pause marketing automations if WhatsApp is down.
3. For Stripe: use Dashboard → Events → resend failed webhooks after recovery.

## Recovery

1. Restore API connectivity to provider endpoints.
2. Replay idempotent handlers — order.paid consumer deduplicates by order id.
3. Run SRI reconciliation cron if invoices were not enqueued.

## Prevention

- Circuit breakers on outbound HTTP (already in payment/SRI layers).
- Alert on webhook error rate > 5% for 5 minutes.
