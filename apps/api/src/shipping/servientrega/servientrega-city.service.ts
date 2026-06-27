import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ServientregaQuoteClient } from './servientrega-quote.client.js';
import {
  getCityId,
  getCityName,
  normalizeLocationName,
} from './servientrega-response.util.js';
import type { ServientregaDestinationCity } from './servientrega.types.js';

@Injectable()
export class ServientregaCityService {
  private readonly logger = new Logger(ServientregaCityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly quoteClient: ServientregaQuoteClient,
  ) {}

  async resolveDestinationCityId(city?: string, province?: string): Promise<number | null> {
    const normalizedCity = normalizeLocationName(city);
    if (!normalizedCity) return null;

    const normalizedProvince = normalizeLocationName(province);

    const exact = await this.prisma.servientregaCity.findFirst({
      where: {
        normalizedName: normalizedCity,
        ...(normalizedProvince ? { normalizedProvince } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (exact) return exact.servientregaCityId;

    const byCityOnly = await this.prisma.servientregaCity.findFirst({
      where: { normalizedName: normalizedCity },
      orderBy: { updatedAt: 'desc' },
    });
    if (byCityOnly) return byCityOnly.servientregaCityId;

    if (!this.quoteClient.isConfigured() || !city?.trim()) {
      return null;
    }

    try {
      const countryId = this.quoteClient.getCountryId();
      const productId = this.quoteClient.getProductId();
      if (!countryId || !productId) return null;

      const suggestions = await this.quoteClient.autocompleteCities(
        countryId,
        productId,
        city,
        this.quoteClient.getLanguage(),
      );
      const match = this.pickBestCityMatch(suggestions, city, province);
      if (!match) return null;

      const cityId = getCityId(match);
      const cityName = getCityName(match);
      if (!cityId || !cityName) return null;

      await this.upsertCity({
        servientregaCityId: cityId,
        name: cityName,
        province: province?.trim() || null,
      });

      return cityId;
    } catch (error) {
      this.logger.warn({ error, city, province }, 'Servientrega city autocomplete failed');
      return null;
    }
  }

  async upsertCity(input: {
    servientregaCityId: number;
    name: string;
    province?: string | null;
  }) {
    const normalizedName = normalizeLocationName(input.name);
    const normalizedProvince = normalizeLocationName(input.province);

    return this.prisma.servientregaCity.upsert({
      where: { servientregaCityId: input.servientregaCityId },
      create: {
        servientregaCityId: input.servientregaCityId,
        name: input.name,
        province: input.province ?? null,
        normalizedName,
        normalizedProvince: normalizedProvince || null,
      },
      update: {
        name: input.name,
        province: input.province ?? null,
        normalizedName,
        normalizedProvince: normalizedProvince || null,
      },
    });
  }

  private pickBestCityMatch(
    cities: ServientregaDestinationCity[],
    city: string,
    province?: string,
  ): ServientregaDestinationCity | null {
    if (!cities.length) return null;

    const targetCity = normalizeLocationName(city);
    const targetProvince = normalizeLocationName(province);

    const exact = cities.find((entry) => normalizeLocationName(getCityName(entry)) === targetCity);
    if (exact) return exact;

    if (targetProvince) {
      const withProvince = cities.find((entry) => {
        const name = normalizeLocationName(getCityName(entry));
        return name.includes(targetCity) || targetCity.includes(name);
      });
      if (withProvince) return withProvince;
    }

    return cities[0] ?? null;
  }
}
