# Proposal: Servientrega Ecuador — guías SOAP y tracking (Fase 2)

## Problem

Fase 1 cotiza en checkout pero el admin sigue creando envíos manualmente (copiar/pegar guía). No hay integración con GeneracionGuias ni sincronización de estados.

## Solution

- SOAP client para `CargueMasivoExterno` (crear guía desde pedido)
- SOAP client para `ConsultarGuia` / `ImagenGuia` (tracking + etiqueta)
- `ServientregaFulfillmentService` orquesta guía → `createShipment` existente
- Sync de tracking admin (por envío y batch)
- UI admin: botón "Generar guía Servientrega"

## Out of scope

- SRI guía 06 automática
- Job cron (solo endpoints admin en MVP)
- Redis cache
