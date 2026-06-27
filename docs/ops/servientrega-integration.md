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

Esto descarga ciudades destino desde `CiudadesDepartamentoDestino` y las guarda en `ServientregaCity`.

## 5. Cotización en checkout

`POST /v1/shipping/quote` usa peso/dimensiones del carrito y `valorDeclarado` = subtotal.

**Regla API:** HTTP 200 con `code !== 1` es error de negocio; la plataforma hace fallback a zonas.

## 6. Próximas fases (no incluidas aún)

- Generación de guías SOAP: `http://web.servientrega.com:8081/GeneracionGuias.asmx`
- Tracking SOAP: `http://sismilenio.servientrega.com/wsrastreoenvios/`
- Guía SRI 06 al despachar

## 7. Referencias

- Tracking público: https://www.servientrega.com.ec/Tracking/
- E-commerce Servientrega: https://www.servientrega.com.ec/
