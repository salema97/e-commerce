export interface ServientregaApiEnvelope {
  code?: number | string;
  message?: string;
  mensaje?: string;
}

export interface ServientregaDestinationCity {
  Id_Ciudad?: number;
  Nombre?: string;
  idCiudad?: number;
  nombre?: string;
}

export interface ServientregaTariff {
  Valor?: number | string;
  valor?: number | string;
  ValorTotal?: number | string;
  valorTotal?: number | string;
  TiempoEntrega?: number | string;
  tiempoEntrega?: number | string;
  Id_Medio_Transporte?: number | string;
  idMedioTransporte?: number | string;
  NombreProducto?: string;
  nombreProducto?: string;
}

export interface ServientregaTariffsResponse extends ServientregaApiEnvelope {
  Tarifas?: ServientregaTariff[];
  tarifas?: ServientregaTariff[];
  data?: {
    Tarifas?: ServientregaTariff[];
    tarifas?: ServientregaTariff[];
  };
}

export interface ServientregaCitiesResponse extends ServientregaApiEnvelope {
  Ciudades?: ServientregaDestinationCity[];
  ciudades?: ServientregaDestinationCity[];
  data?: ServientregaDestinationCity[] | { Ciudades?: ServientregaDestinationCity[] };
}

export interface ServientregaTariffsParams {
  originCityId: number;
  destinationCityId: number;
  lengthCm: number;
  heightCm: number;
  widthCm: number;
  weightKg: number;
  declaredValue: number;
  productId: number;
  language: string;
}

export interface ServientregaCitySyncResult {
  upserted: number;
  originCityId: number;
  countryId: number;
  productId: number;
}
