import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resilientFetch } from '../../common/resilience/resilient-fetch.js';
import {
  extractServientregaCities,
  extractServientregaTariffs,
  getServientregaErrorMessage,
  isServientregaSuccess,
} from './servientrega-response.util.js';
import type {
  ServientregaCitiesResponse,
  ServientregaDestinationCity,
  ServientregaTariff,
  ServientregaTariffsParams,
  ServientregaTariffsResponse,
} from './servientrega.types.js';

@Injectable()
export class ServientregaQuoteClient {
  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.getCountryId() && this.getOriginCityId() && this.getProductId() && this.getBaseUrl(),
    );
  }

  getBaseUrl(): string {
    const configured = this.config.get<string>('SERVIENTREGA_QUOTE_BASE_URL');
    return (configured ?? 'https://mobile.servientrega.com/ApiIngresoCLientes').replace(/\/$/, '');
  }

  getCountryId(): number | null {
    return this.readPositiveInt('SERVIENTREGA_COUNTRY_ID');
  }

  getOriginCityId(): number | null {
    return this.readPositiveInt('SERVIENTREGA_ORIGIN_CITY_ID');
  }

  getProductId(): number | null {
    return this.readPositiveInt('SERVIENTREGA_PRODUCT_ID');
  }

  getLanguage(): string {
    return this.config.get<string>('SERVIENTREGA_LANGUAGE') ?? 'es';
  }

  async getTariffs(params: ServientregaTariffsParams): Promise<ServientregaTariff[]> {
    const path = [
      'api',
      'Cotizador',
      'Tarifas',
      params.originCityId,
      params.destinationCityId,
      params.lengthCm,
      params.heightCm,
      params.widthCm,
      params.weightKg,
      params.declaredValue,
      params.productId,
      params.language,
    ].join('/');

    const payload = await this.getJson<ServientregaTariffsResponse>(path);
    if (!isServientregaSuccess(payload)) {
      throw new Error(getServientregaErrorMessage(payload));
    }

    const tariffs = extractServientregaTariffs(payload);
    if (!tariffs.length) {
      throw new Error('Servientrega returned no tariffs');
    }
    return tariffs;
  }

  async getDestinationCities(
    countryId: number,
    originCityId: number,
    productId: number,
    language = 'es',
  ): Promise<ServientregaDestinationCity[]> {
    const path = [
      'api',
      'Cotizador',
      'CiudadesDepartamentoDestino',
      countryId,
      originCityId,
      productId,
      language,
    ].join('/');

    const payload = await this.getJson<ServientregaCitiesResponse>(path);
    if (!isServientregaSuccess(payload)) {
      throw new Error(getServientregaErrorMessage(payload));
    }
    return extractServientregaCities(payload);
  }

  async autocompleteCities(
    countryId: number,
    productId: number,
    cityName: string,
    language = 'es',
  ): Promise<ServientregaDestinationCity[]> {
    const encoded = encodeURIComponent(cityName.trim());
    const path = [
      'api',
      'Cotizador',
      'AutoCompleteCiudadesOrigen',
      countryId,
      productId,
      language,
      encoded,
    ].join('/');

    const payload = await this.getJson<ServientregaCitiesResponse>(path);
    if (!isServientregaSuccess(payload)) {
      throw new Error(getServientregaErrorMessage(payload));
    }
    return extractServientregaCities(payload);
  }

  private async getJson<T>(path: string): Promise<T> {
    const url = `${this.getBaseUrl()}/${path}`;
    const response = await resilientFetch('shipping.servientrega', url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Servientrega HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  }

  private readPositiveInt(key: string): number | null {
    const raw = this.config.get<string | number>(key);
    if (raw === undefined || raw === null || raw === '') return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
}
