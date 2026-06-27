import type {
  ServientregaApiEnvelope,
  ServientregaDestinationCity,
  ServientregaTariff,
  ServientregaTariffsResponse,
} from './servientrega.types.js';

export function isServientregaSuccess(payload: ServientregaApiEnvelope | null | undefined): boolean {
  if (!payload || payload.code === undefined || payload.code === null) {
    return false;
  }
  return Number(payload.code) === 1;
}

export function getServientregaErrorMessage(payload: ServientregaApiEnvelope): string {
  return payload.message ?? payload.mensaje ?? 'Servientrega request failed';
}

export function extractServientregaTariffs(
  payload: ServientregaTariffsResponse,
): ServientregaTariff[] {
  if (Array.isArray(payload.tarifas)) return payload.tarifas;
  if (Array.isArray(payload.Tarifas)) return payload.Tarifas;
  if (Array.isArray(payload.data?.tarifas)) return payload.data.tarifas;
  if (Array.isArray(payload.data?.Tarifas)) return payload.data.Tarifas;
  return [];
}

export function extractServientregaCities(payload: {
  ciudades?: ServientregaDestinationCity[];
  Ciudades?: ServientregaDestinationCity[];
  data?: ServientregaDestinationCity[] | { Ciudades?: ServientregaDestinationCity[] };
}): ServientregaDestinationCity[] {
  if (Array.isArray(payload.ciudades)) return payload.ciudades;
  if (Array.isArray(payload.Ciudades)) return payload.Ciudades;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && 'Ciudades' in payload.data && Array.isArray(payload.data.Ciudades)) {
    return payload.data.Ciudades;
  }
  return [];
}

export function getCityId(city: ServientregaDestinationCity): number | null {
  const id = city.idCiudad ?? city.Id_Ciudad;
  if (id === undefined || id === null) return null;
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getCityName(city: ServientregaDestinationCity): string {
  return (city.nombre ?? city.Nombre ?? '').trim();
}

export function getTariffAmount(tariff: ServientregaTariff): number {
  const raw = tariff.valorTotal ?? tariff.ValorTotal ?? tariff.valor ?? tariff.Valor ?? 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getTariffDeliveryDays(tariff: ServientregaTariff): number | undefined {
  const raw = tariff.tiempoEntrega ?? tariff.TiempoEntrega;
  if (raw === undefined || raw === null) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeLocationName(value?: string | null): string {
  if (!value) return '';
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}
