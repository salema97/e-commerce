# Design: Servientrega fulfillment

## Flow

```
Admin → POST /fulfillment/orders/:id/shipments/servientrega
  → ServientregaFulfillmentService
      → load order + resolve city id
      → ServientregaGuideSoapClient.CargueMasivoExterno
      → ManualFulfillmentProvider.createShipment(tracking, url, externalId)
```

```
Admin → POST /fulfillment/shipments/:id/servientrega/sync-tracking
  → ServientregaTrackingSyncService
      → ConsultarGuia
      → update Shipment.status / deliveredAt
```

## SOAP endpoints

| Service | WSDL default |
|---------|----------------|
| Guías | `http://web.servientrega.com:8081/GeneracionGuias.asmx?wsdl` |
| Tracking | `http://sismilenio.servientrega.com/wsrastreoenvios/wsrastreoenvios.asmx?wsdl` |

## Auth

SOAP `AuthHeader`: login, pwd, Id_CodFacturacion, Nombre_Cargue

## Idempotency

Reject if order already has IN_TRANSIT Servientrega shipment without partial line override.

## Tracking URL

`https://www.servientrega.com.ec/Tracking/?guia={num}&tipo=GUIA`
