# Runbook: Webhook Provider Incident

## Purpose
Restore reliable webhook processing when a payment provider or Evolution API stops delivering or accepting webhook events.

## When to use this runbook
- Webhook endpoint 4xx/5xx rates spike.
- Orders are stuck in `PAYMENT_PENDING` despite customer payment confirmation.
- Duplicate webhooks are observed in logs or audit records.
- Provider dashboard shows failed webhook deliveries.

## Prerequisites
- API logs and Redis access.
- Provider dashboard credentials (Stripe, Kushki, PayPhone, MercadoPago, PlaceToPay, Evolution).
- Access to `payment`, `order`, `audit_log`, and `webhook_event` tables.

## Steps

### 1. Identify the affected provider
Check recent logs or alert events:
```
alert.webhook_failure { provider: 'kushki', reason: 'invalid_signature' }
```
Look at the URL path:
- `/v1/webhooks/payments/:provider` → local payment providers.
- `/v1/webhooks/stripe` → Stripe.
- `/v1/webhooks/evolution` → Evolution API.

### 2. Verify signature and idempotency
Each webhook handler uses provider-specific signature validation and Redis idempotency keys:
- Key pattern: `idempotency:{provider}:{transactionId}`.
- TTLs: Stripe/Kushki/MercadoPago 24h, PayPhone/PlaceToPay 12h.

If a duplicate webhook is suspected:
```bash
redis-cli KEYS "idempotency:<provider>:<transactionId>"
redis-cli TTL "idempotency:<provider>:<transactionId>"
```

If a valid webhook was dropped, release the idempotency key only after confirming the original event was not processed:
```bash
redis-cli DEL "idempotency:<provider>:<transactionId>"
```

### 3. Check for provider-side issues
- Confirm the webhook URL registered in the provider dashboard matches the public API URL (`API_PUBLIC_URL`).
- Verify the provider secret/token in the environment matches the dashboard value.
- Look for provider status page incidents.

### 4. Inspect failed events
Search audit logs:
```sql
SELECT resource, action, resource_id, metadata, created_at
FROM audit_logs
WHERE resource IN ('stripe-webhook', 'payment-webhook')
  AND created_at > now() - interval '1 hour'
ORDER BY created_at DESC;
```

### 5. Manual replay (last resort)
Only replay after confirming idempotency and signature:
1. Retrieve the original payload from provider dashboard or logs.
2. Re-post to the appropriate endpoint with the correct signature header.
3. Verify the order transitions and an invoice job is enqueued.

For local providers, use the admin API or a signed `curl` request.

### 6. Validate recovery
- New provider webhooks return 200.
- `alert.webhook_failure` events stop.
- Orders transition from `PAYMENT_PENDING` to `PROCESSING` or `PAYMENT_FAILED` as expected.

## Rollback
If replay causes duplicate payments or orders, stop the affected webhook controller and revert any duplicate order status changes manually.

## Escalation
Escalate to the Payments team and engineering lead when:
- The provider is down for more than 15 minutes.
- Signature verification cannot be restored.
- Financial discrepancies are detected.
