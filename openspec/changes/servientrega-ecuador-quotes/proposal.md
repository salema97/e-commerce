# Proposal: Servientrega Ecuador — cotización en checkout (MVP)

## Problem

La plataforma usa `CarrierRateProvider` con agregadores internacionales (Shippo/EasyPost/ShipEngine) o tarifas planas por zona. Para operación en Ecuador, Servientrega es el carrier principal en seed y admin, pero no hay integración con su API de cotización.

## Solution

Primer slice SDD `servientrega-ecuador-quotes`: adapter REST sobre [ApiIngresoCLientes v1.0.2](https://mobile.servientrega.com/ApiIngresoCLientes/Help) para cotizar en checkout, catálogo local de ciudades sincronizable, fallback a `ZoneFlatRateProvider` si faltan credenciales o falla la API.

**Fuera de alcance en este PR:** generación SOAP de guías, tracking SOAP, guía SRI 06.

## Success criteria

- `CARRIER_RATE_PROVIDER=servientrega` resuelve `ServientregaCarrierRateProvider`
- Cotización usa dimensiones/peso del carrito y `valorDeclarado` = subtotal
- Sync de ciudades vía endpoint admin + persistencia Prisma
- HTTP 200 con `code !== 1` tratado como error lógico
- Tests unitarios con mocks; `pnpm --filter @repo/api test` verde
- Documentación ops en `docs/ops/servientrega-integration.md`
