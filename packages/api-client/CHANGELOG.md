# Changelog — @repo/api-client

All notable changes to the generated client align with the NestJS OpenAPI spec at `/v1/docs`.

## 1.0.0-v1 — 2026-06-26

### Added

- Initial versioned release aligned with REST API `/v1`.
- `fulfillment.listAllShipments()` — admin global shipment list.
- `fulfillment.listBackorders()` — typed `BackorderLine[]`.
- `bulkImport.importProducts(csv)` — products CSV bulk import.

### Notes

- Package version suffix `-v1` maps to the API global prefix. See `API-VERSION.md`.
