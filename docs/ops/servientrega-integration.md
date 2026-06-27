# Servientrega Ecuador — integración

Checklist operativo para activar cotización Servientrega en la plataforma.

## 1. Cuenta comercial

- Contactar Servientrega Ecuador: PBX **3732000** (opción 2)
- Requisitos cliente crédito: RUC, nombramiento, cédula representante legal
- Facturación mínima referencial: $400/mes ciudades principales, $200/mes secundarias
- Portal empresas: https://empresas.servientrega.com.ec/

## 2. Datos técnicos a solicitar

| Variable | Descripción |
|----------|-------------|
| `SERVIENTREGA_COUNTRY_ID` | `idPais` Ecuador en API cotizador |
| `SERVIENTREGA_ORIGIN_CITY_ID` | Ciudad de bodega/almacén |
| `SERVIENTREGA_PRODUCT_ID` | Producto logístico contratado |
| `SERVIENTREGA_LANGUAGE` | `es` (default) |

Documentación REST: https://mobile.servientrega.com/ApiIngresoCLientes/Help

## 3. Configuración en API

```bash
CARRIER_RATE_PROVIDER=servientrega
SERVIENTREGA_QUOTE_BASE_URL=https://mobile.servientrega.com/ApiIngresoCLientes
SERVIENTREGA_COUNTRY_ID=<from-servientrega>
SERVIENTREGA_ORIGIN_CITY_ID=<warehouse-city-id>
SERVIENTREGA_PRODUCT_ID=<product-id>
SERVIENTREGA_LANGUAGE=es
```

Sin las variables obligatorias, el sistema usa **fallback a zonas** (`servientrega-fallback`).

## 4. Sincronizar ciudades

Tras configurar credenciales:

```http
POST /v1/shipping/servientrega/sync-cities
Authorization: Bearer <admin-jwt>
```

## 5. Generar guía (Fase 2)

Configura además:

```bash
SERVIENTREGA_LOGIN=
SERVIENTREGA_PASSWORD=
SERVIENTREGA_BILLING_CODE=
SERVIENTREGA_LOAD_NAME=
SERVIENTREGA_ORIGIN_CONTACT_NAME=
SERVIENTREGA_ORIGIN_STREET=
SERVIENTREGA_ORIGIN_CITY_NAME=
```

Endpoint:

```http
POST /v1/fulfillment/orders/:orderId/shipments/servientrega
Authorization: Bearer <admin-jwt>
```

Sync tracking:

```http
POST /v1/fulfillment/shipments/:shipmentId/servientrega/sync-tracking
POST /v1/fulfillment/servientrega/sync-tracking
```

## 6. Cotización en checkout

`POST /v1/shipping/quote` usa peso/dimensiones del carrito y `valorDeclarado` = subtotal.

**Regla API:** HTTP 200 con `code !== 1` es error de negocio; la plataforma hace fallback a zonas.

## 7. Próximas fases (no incluidas aún)

- Generación de guías SOAP: implementado (`GeneracionGuias.asmx`)
- Tracking SOAP: implementado (`wsRastreoEnvios`)
- Guía SRI 06 al despachar

## 8. Referencias

- Tracking público: https://www.servientrega.com.ec/Tracking/
- E-commerce Servientrega: https://www.servientrega.com.ec/
