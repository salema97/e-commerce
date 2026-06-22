import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider as PaymentProviderEnum } from './payment-provider.enum.js';
import { PaymentProvider, ProviderSelectionContext } from './payment-provider.interface.js';
import { StripeProvider } from './stripe/stripe.provider.js';
import { KushkiProvider } from './kushki/kushki.provider.js';
import { PayPhoneProvider } from './payphone/payphone.provider.js';
import { MercadoPagoProvider } from './mercadopago/mercadopago.provider.js';
import { PlaceToPayProvider } from './placetopay/placetopay.provider.js';

@Injectable()
export class PaymentProviderFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly stripeProvider: StripeProvider,
    private readonly kushkiProvider: KushkiProvider,
    private readonly payPhoneProvider: PayPhoneProvider,
    private readonly mercadoPagoProvider: MercadoPagoProvider,
    private readonly placeToPayProvider: PlaceToPayProvider,
  ) {}

  getProvider(provider: PaymentProviderEnum): PaymentProvider {
    switch (provider) {
      case PaymentProviderEnum.STRIPE:
        return this.stripeProvider;
      case PaymentProviderEnum.KUSHKI:
        return this.kushkiProvider;
      case PaymentProviderEnum.PAYPHONE:
        return this.payPhoneProvider;
      case PaymentProviderEnum.MERCADOPAGO:
        return this.mercadoPagoProvider;
      case PaymentProviderEnum.PLACETOPAY:
        return this.placeToPayProvider;
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  resolveProvider(
    context: ProviderSelectionContext & { paymentProvider?: string },
  ): PaymentProvider {
    if (context.adminOverride) {
      return this.getProvider(context.adminOverride as PaymentProviderEnum);
    }

    if (context.paymentProvider) {
      return this.getProvider(context.paymentProvider as PaymentProviderEnum);
    }

    const isEcuador =
      context.country?.toLowerCase() === 'ecuador' || context.country?.toLowerCase() === 'ec';
    const method = context.method?.toLowerCase();

    if (isEcuador && method) {
      switch (method) {
        case 'kushki':
          return this.kushkiProvider;
        case 'payphone':
          return this.payPhoneProvider;
        case 'mercadopago':
          return this.mercadoPagoProvider;
        case 'placetopay':
        case 'place_to_pay':
          return this.placeToPayProvider;
        default:
          break;
      }
    }

    if (isEcuador) {
      const defaultLocal = this.configService
        .get('DEFAULT_LOCAL_PAYMENT_PROVIDER')
        ?.toUpperCase();
      if (defaultLocal && Object.values(PaymentProviderEnum).includes(defaultLocal as PaymentProviderEnum)) {
        return this.getProvider(defaultLocal as PaymentProviderEnum);
      }
    }

    return this.stripeProvider;
  }

  getProviderName(provider: PaymentProvider): PaymentProviderEnum | undefined {
    if (provider === this.stripeProvider) return PaymentProviderEnum.STRIPE;
    if (provider === this.kushkiProvider) return PaymentProviderEnum.KUSHKI;
    if (provider === this.payPhoneProvider) return PaymentProviderEnum.PAYPHONE;
    if (provider === this.mercadoPagoProvider) return PaymentProviderEnum.MERCADOPAGO;
    if (provider === this.placeToPayProvider) return PaymentProviderEnum.PLACETOPAY;
    return undefined;
  }
}
