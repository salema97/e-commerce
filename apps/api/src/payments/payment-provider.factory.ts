import { Injectable } from '@nestjs/common';
import { PaymentProvider as PaymentProviderEnum } from './payment-provider.enum.js';
import { PaymentProvider } from './payment-provider.interface.js';
import { StripeProvider } from './stripe/stripe.provider.js';
import { KushkiProvider } from './kushki/kushki.provider.js';
import { PayPhoneProvider } from './payphone/payphone.provider.js';
import { MercadoPagoProvider } from './mercadopago/mercadopago.provider.js';
import { PlaceToPayProvider } from './placetopay/placetopay.provider.js';

@Injectable()
export class PaymentProviderFactory {
  constructor(
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
}
