import { Injectable, Logger } from '@nestjs/common';
import { ServientregaCityService } from './servientrega-city.service.js';
import { ServientregaQuoteClient } from './servientrega-quote.client.js';
import { getCityId, getCityName } from './servientrega-response.util.js';
import type { ServientregaCitySyncResult } from './servientrega.types.js';

@Injectable()
export class ServientregaCitySyncService {
  private readonly logger = new Logger(ServientregaCitySyncService.name);

  constructor(
    private readonly quoteClient: ServientregaQuoteClient,
    private readonly cityService: ServientregaCityService,
  ) {}

  async syncDestinationCities(): Promise<ServientregaCitySyncResult> {
    if (!this.quoteClient.isConfigured()) {
      throw new Error(
        'Servientrega is not configured. Set SERVIENTREGA_COUNTRY_ID, SERVIENTREGA_ORIGIN_CITY_ID, and SERVIENTREGA_PRODUCT_ID.',
      );
    }

    const countryId = this.quoteClient.getCountryId()!;
    const originCityId = this.quoteClient.getOriginCityId()!;
    const productId = this.quoteClient.getProductId()!;
    const language = this.quoteClient.getLanguage();

    const cities = await this.quoteClient.getDestinationCities(
      countryId,
      originCityId,
      productId,
      language,
    );

    let upserted = 0;
    for (const city of cities) {
      const cityId = getCityId(city);
      const name = getCityName(city);
      if (!cityId || !name) continue;

      await this.cityService.upsertCity({
        servientregaCityId: cityId,
        name,
        province: null,
      });
      upserted += 1;
    }

    this.logger.log(
      { upserted, originCityId, countryId, productId },
      'Servientrega destination cities synced',
    );

    return { upserted, originCityId, countryId, productId };
  }
}
