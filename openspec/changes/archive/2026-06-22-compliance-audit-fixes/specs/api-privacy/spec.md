# Spec: API Privacy (JWT native)

## Requirements

### REQ-PRIV-001 Export personal data
- **WHEN** authenticated user calls `GET /v1/privacy/me/export`
- **THEN** service resolves user via `UserProvisioningService.ensureByUserId(userId)` from JWT claim
- **AND** returns GDPR export bundle (addresses, orders, returns, loyalty, referrals, quotes, prefs)

### REQ-PRIV-002 Delete / anonymize
- **WHEN** user calls `DELETE /v1/privacy/me`
- **THEN** PII is anonymized in transaction; orders retained for tax
- **AND** response message references native auth account deletion (no Clerk)

### REQ-PRIV-003 CCPA opt-out
- **WHEN** user patches `me/ccpa-opt-out`
- **THEN** `ccpaDoNotSell` updated for JWT user id
