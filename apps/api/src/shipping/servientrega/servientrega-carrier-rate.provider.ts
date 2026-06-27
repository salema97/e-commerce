import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CarrierRateProvider,
  CarrierRateQuoteInput,
  CarrierRateQuoteResult,
} from '../carrier-rate-provider.interface.js';
import { ZoneFlatRateProvider } from '../zone-flat-rate.provider.js';
import { ServientregaCityService } from './servientrega-city.service.js';
import { ServientregaQuoteClient } from './servientrega-quote.client.js';
import {
  getTariffAmount,
  getTariffDeliveryDays,
} from './servientrega-response.util.js';

@Injectable()
export class ServientregaCarrierRateProvider extends CarrierRateProvider {
  private readonly logger = new Logger(ServientregaCarrierRateProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly quoteClient: ServientregaQuoteClient,
    private readonly cityService: ServientregaCityService,
    private readonly fallback: ZoneFlatRateProvider,
  ) {
    super();
  }

  async quote(input: CarrierRateQuoteInput): Promise<CarrierRateQuoteResult> {
    if (!this.quoteClient.isConfigured()) {
      const fallback = await this.fallback.quote(input);
      return { ...fallback, provider: 'servientrega-fallback' };
    }

    try {
      const originCityId = this.quoteClient.getOriginCityId()!;
      const productId = this.quoteClient.getProductId()!;
      const destinationCityId = await this.cityService.resolveDestinationCityId(
        input.destination.city,
        input.destination.province,
      );

      if (!destinationCityId) {
        throw new Error('Destination city could not be mapped to Servientrega');
      }

      const lengthCm = Math.max(1, Math.round(input.parcel?.lengthCm ?? 20));
      const widthCm = Math.max(1, Math.round(input.parcel?.widthCm ?? 15));
      const heightCm = Math.max(1, Math.round(input.parcel?.heightCm ?? 10));
      const weightKg = Math.max(1, Math.round(input.parcel?.weightKg ?? 1));
      const declaredValue = Math.max(1, Math.round(input.subtotal));

      const tariffs = await this.quoteClient.getTariffs({
        originCityId,
        destinationCityId,
        lengthCm,
        heightCm,
        widthCm,
        weightKg,
        declaredValue,
        productId,
        language: this.quoteClient.getLanguage(),
      });

      const sorted = [...tariffs].sort((a, b) => getTariffAmount(a) - getTariffAmount(b));
      const cheapest = sorted[0];
      const amount = getTariffAmount(cheapest);
      const deliveryDays = getTariffDeliveryDays(cheapest);

      const zoneFallback = await this.fallback.quote(input);
      const freeShippingThreshold = Number(this.config.get('SHIPPING_FREE_THRESHOLD') ?? 50);
      const qualifiesForFree =
        Boolean(input.freeShipping) || input.subtotal >= freeShippingThreshold;

      const options = sorted.slice(0, 5).map((tariff, index) => {
        const optionAmount = getTariffAmount(tariff);
        const days = getTariffDeliveryDays(tariff) ?? deliveryDays ?? zoneFallback.estimatedDaysMin;
        return {
          provider: 'servientrega',
          carrier: 'Servientrega',
          service: tariff.nombreProducto ?? tariff.NombreProducto ?? `tariff-${index + 1}`,
          amount: qualifiesForFree ? 0 : optionAmount,
          currency: 'USD',
          estimatedDaysMin: days,
          estimatedDaysMax: days + 2,
        };
      });

      return {
        amount: qualifiesForFree ? 0 : Number(amount.toFixed(2)),
        zoneCode: zoneFallback.zoneCode,
        zoneName: zoneFallback.zoneName,
        freeShippingApplied: qualifiesForFree,
        estimatedDaysMin: deliveryDays ?? zoneFallback.estimatedDaysMin,
        estimatedDaysMax: (deliveryDays ?? zoneFallback.estimatedDaysMin) + 2,
        provider: 'servientrega',
        options,
      };
    } catch (error) {
      this.logger.warn({ error }, 'Servientrega rate quote failed; using zone fallback');
      const fallback = await this.fallback.quote(input);
      return { ...fallback, provider: 'servientrega-fallback' };
    }
  }
}
