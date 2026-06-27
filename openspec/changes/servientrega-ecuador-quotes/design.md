# Design: Servientrega Ecuador quotes

## Architecture

```
ShippingService.quote()
  → CarrierRateProviderFactory.resolve()
  → ServientregaCarrierRateProvider.quote()
       → ServientregaCityService.resolveDestinationCityId()
       → ServientregaQuoteClient.getTariffs()
       → (on failure) ZoneFlatRateProvider.quote()
```

## Components

| Component | Responsibility |
|-----------|----------------|
| `ServientregaQuoteClient` | REST calls to cotizador; `resilientFetch` key `shipping.servientrega` |
| `ServientregaCityService` | Lookup normalized city+province; optional live autocomplete |
| `ServientregaCitySyncService` | Pull destinations from API; upsert `ServientregaCity` |
| `ServientregaCarrierRateProvider` | Maps API tariffs → `CarrierRateQuoteResult` |

## API contract (Servientrega)

- Success when response JSON `code === 1` (not merely HTTP 200)
- Tariffs: `GET api/Cotizador/Tarifas/{origin}/{dest}/{largo}/{alto}/{ancho}/{peso}/{valorDeclarado}/{idProducto}/{language}`
- Cities: `GET api/Cotizador/CiudadesDepartamentoDestino/{idPais}/{idCiudadOrigen}/{idProducto}/{language}`

## Data model

`ServientregaCity`: `servientregaCityId`, `name`, `province`, `normalizedName`, `countryCode`

## Configuration

```bash
CARRIER_RATE_PROVIDER=servientrega
SERVIENTREGA_QUOTE_BASE_URL=https://mobile.servientrega.com/ApiIngresoCLientes
SERVIENTREGA_COUNTRY_ID=          # idPais Ecuador (from Servientrega)
SERVIENTREGA_ORIGIN_CITY_ID=
SERVIENTREGA_PRODUCT_ID=
SERVIENTREGA_LANGUAGE=es
```

Optional auth headers if account requires them (future).

## Resilience

- Missing env → `zones` fallback (`servientrega-fallback` provider tag)
- API/network error → zone fallback + structured log
- Unmapped destination city → zone fallback

## Future PRs

- `servientrega-ecuador-fulfillment`: SOAP `GeneracionGuias.asmx`, tracking `wsRastreoEnvios`
- SRI guía 06 linkage on shipment create
