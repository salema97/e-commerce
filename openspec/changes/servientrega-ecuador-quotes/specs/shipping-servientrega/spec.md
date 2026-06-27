# Spec: Shipping — Servientrega Ecuador quotes

## REQ-SRV-001 Provider registration

WHEN `CARRIER_RATE_PROVIDER` is `servientrega`
THEN the shipping quote endpoint SHALL use `ServientregaCarrierRateProvider`.

## REQ-SRV-002 Credential gating

WHEN any of `SERVIENTREGA_COUNTRY_ID`, `SERVIENTREGA_ORIGIN_CITY_ID`, or `SERVIENTREGA_PRODUCT_ID` is unset
THEN quotes SHALL fall back to zone flat rates with `provider` containing `servientrega-fallback`.

## REQ-SRV-003 Tariff request

WHEN credentials are configured and destination city resolves
THEN the system SHALL call Servientrega Tarifas API with weight (kg), dimensions (cm), declared value (order subtotal rounded), product id, and language `es`.

## REQ-SRV-004 Response semantics

WHEN Servientrega returns HTTP 200 with `code !== 1`
THEN the system SHALL treat the response as a business error and fall back to zone rates.

## REQ-SRV-005 City catalog

WHEN an admin calls `POST /v1/shipping/servientrega/sync-cities`
THEN destination cities SHALL be fetched from Servientrega and upserted into `ServientregaCity`.

## REQ-SRV-006 City resolution

WHEN quoting, the system SHALL match checkout `city` + `province` against `ServientregaCity` using normalized names.

## REQ-SRV-007 Free shipping

WHEN subtotal meets `SHIPPING_FREE_THRESHOLD` or `freeShipping` is true
THEN returned `amount` SHALL be 0 regardless of carrier tariff (same as zone provider behavior).
