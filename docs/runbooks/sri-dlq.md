# Runbook: SRI DLQ Recovery

## Purpose
Handle SRI document jobs that have moved to the dead-letter queue (DLQ) status after exhausting retries.

## When to use this runbook
- An invoice or credit note job shows `status = DLQ` in `sriDocumentJob`.
- SRI web services are degraded or returning persistent errors.
- A certificate, XML, or sequencing issue causes repeated submission failures.

## Prerequisites
- Database access (Prisma/PSQL).
- Access to SRI SOAP endpoints and the configured `.p12` certificate.
- Access to stored XML/PDF in S3/MinIO or local storage.

## Steps

### 1. Identify the DLQ record
```sql
SELECT id, job_id, document_type, document_id, status, attempts, last_error, created_at
FROM sri_document_jobs
WHERE status = 'DLQ'
ORDER BY updated_at DESC
LIMIT 20;
```

### 2. Inspect the failure reason
Look at `last_error` and application logs for the job:
- `SRI timeout` → transient network issue; retry is usually safe.
- `CERTIFICADO no válido` or signing error → verify certificate path/password and expiry.
- `CLAVE DE ACCESO REGISTRADA` or duplicate sequence → document may already exist; query SRI directly.
- `RECHAZADA` with specific error code → fix XML/sequence/tax data before retry.

### 3. Verify the document state
For invoices:
```sql
SELECT id, order_id, access_key, sequence_number, status, sri_response
FROM invoices
WHERE order_id = '<document_id>';
```

For credit notes:
```sql
SELECT id, return_request_id, access_key, sequence_number, status, sri_response
FROM credit_notes
WHERE id = '<document_id>';
```

If an `access_key` exists, query SRI authorization status with the access key via the admin UI or SOAP endpoint.

### 4. Fix the root cause
- **Certificate issue**: ensure `SRI_DIGITAL_CERTIFICATE_PATH` and `SRI_DIGITAL_CERTIFICATE_PASSWORD` are correct; test signing locally.
- **Sequence collision**: confirm the sequence number was not used elsewhere; the sequence allocator must stay in sync with SRI.
- **XML/tax data issue**: inspect the generated XML in storage, fix the underlying order/customer/tax data, and regenerate.

### 5. Retry or regenerate
Option A — Manual retry (safe for transient errors):
```sql
UPDATE sri_document_jobs
SET status = 'PENDING', attempts = 0, last_error = NULL
WHERE id = '<dlq_record_id>';
```
The SRI queue worker will pick up the job again.

Option B — Regenerate the document:
If the XML or access key is invalid, delete the failed invoice/credit note record (only if not yet authorized) and re-enqueue from the originating order or return request through the admin UI or API.

### 6. Confirm resolution
- Poll the job status until it reaches `COMPLETED`.
- Verify the SRI authorization number and access key are populated.
- Confirm the customer received the PDF/XML via email/WhatsApp.

## Rollback
If retry makes the situation worse (e.g., duplicate sequence numbers), stop the SRI queue worker, revert the `sriDocumentJob` status to `DLQ`, and escalate to the finance/operations lead.

## Escalation
Escalate to the Finance team and SRI integration owner when:
- Multiple DLQ records appear in a short window.
- Certificate or signing errors persist after verification.
- SRI production endpoints are down for more than 30 minutes.
