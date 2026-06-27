# Spec: Servientrega fulfillment

## REQ-SRV-F01 Guide creation endpoint

WHEN admin calls `POST /v1/fulfillment/orders/:orderId/shipments/servientrega`
AND SOAP credentials are configured
THEN a guide SHALL be created via Servientrega and a shipment record persisted with tracking number.

## REQ-SRV-F02 Missing SOAP config

WHEN SOAP credentials are missing
THEN endpoint SHALL return 400 with actionable error (no silent fallback).

## REQ-SRV-F03 Tracking sync

WHEN admin syncs tracking for a Servientrega shipment
THEN `ConsultarGuia` SHALL update shipment status when delivery is detected.

## REQ-SRV-F04 Public tracking URL

WHEN guide is created
THEN `trackingUrl` SHALL point to Servientrega Ecuador public tracking.

## REQ-SRV-F05 Admin UI

WHEN carrier is Servientrega on order detail
THEN admin SHALL see button to generate guide without manual tracking entry.
