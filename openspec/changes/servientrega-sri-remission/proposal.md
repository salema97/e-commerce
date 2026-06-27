# Proposal: Guía SRI 06 al despachar con Servientrega

## Problem

Tras crear guía Servientrega, no se emite guía de remisión SRI (06) vinculada al envío — requisito operativo Ecuador.

## Solution

- Enlazar `SriSupplementaryDocument` tipo `06` con `Shipment`
- Emitir automáticamente (no bloqueante) tras `createServientregaShipment` si `SERVIENTREGA_SRI_REMISSION_ENABLED=true`
- Mejorar XML guía 06: placa, ruta con número Servientrega, destinatario desde `shippingAddress`

## Success criteria

- Shipment Servientrega puede tener guía SRI 06 asociada
- Fallo SRI no revierte el envío
- Respuesta API incluye estado SRI
