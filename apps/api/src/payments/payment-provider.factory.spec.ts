import { describe, it, expect, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { PaymentProviderFactory } from './payment-provider.factory.js';
import { StripeProvider } from './stripe/stripe.provider.js';
import { KushkiProvider } from './kushki/kushki.provider.js';
import { PayPhoneProvider } from './payphone/payphone.provider.js';
import { MercadoPagoProvider } from './mercadopago/mercadopago.provider.js';
import { PlaceToPayProvider } from './placetopay/placetopay.provider.js';
import { PaymentProvider as PaymentProviderEnum } from './payment-provider.enum.js';

describe('PaymentProviderFactory', () => {
  let factory: PaymentProviderFactory;
  let stripeProvider: StripeProvider;
  let kushkiProvider: KushkiProvider;
  let payPhoneProvider: PayPhoneProvider;
  let mercadoPagoProvider: MercadoPagoProvider;
  let placeToPayProvider: PlaceToPayProvider;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PaymentProviderFactory,
        { provide: StripeProvider, useValue: { name: 'StripeProvider' } as unknown as StripeProvider },
        { provide: KushkiProvider, useValue: { name: 'KushkiProvider' } as unknown as KushkiProvider },
        { provide: PayPhoneProvider, useValue: { name: 'PayPhoneProvider' } as unknown as PayPhoneProvider },
        { provide: MercadoPagoProvider, useValue: { name: 'MercadoPagoProvider' } as unknown as MercadoPagoProvider },
        { provide: PlaceToPayProvider, useValue: { name: 'PlaceToPayProvider' } as unknown as PlaceToPayProvider },
      ],
    }).compile();

    factory = module.get(PaymentProviderFactory);
    stripeProvider = module.get(StripeProvider);
    kushkiProvider = module.get(KushkiProvider);
    payPhoneProvider = module.get(PayPhoneProvider);
    mercadoPagoProvider = module.get(MercadoPagoProvider);
    placeToPayProvider = module.get(PlaceToPayProvider);
  });

  it('returns Stripe provider by default', () => {
    const provider = factory.getProvider(PaymentProviderEnum.STRIPE);
    expect(provider).toBe(stripeProvider);
  });

  it('returns the matching local provider for each enum value', () => {
    expect(factory.getProvider(PaymentProviderEnum.KUSHKI)).toBe(kushkiProvider);
    expect(factory.getProvider(PaymentProviderEnum.PAYPHONE)).toBe(payPhoneProvider);
    expect(factory.getProvider(PaymentProviderEnum.MERCADOPAGO)).toBe(mercadoPagoProvider);
    expect(factory.getProvider(PaymentProviderEnum.PLACETOPAY)).toBe(placeToPayProvider);
  });

  it('throws for unsupported provider enum values', () => {
    expect(() => factory.getProvider('UNKNOWN' as PaymentProviderEnum)).toThrow(
      'Unsupported payment provider: UNKNOWN',
    );
  });
});
