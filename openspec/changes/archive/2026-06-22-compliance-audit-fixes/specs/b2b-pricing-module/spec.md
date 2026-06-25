# Spec: B2B pricing module boundary

## Requirements

### REQ-B2B-001 Pricing module isolation
- **WHEN** `QuotesModule` needs negotiated pricing
- **THEN** it imports `B2bPricingModule` only (not `B2bModule`)
- **AND** NestJS Doctor reports no circular dependency between B2b and Quotes
