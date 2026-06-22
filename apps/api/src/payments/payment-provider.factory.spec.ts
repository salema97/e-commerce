import { describe, it, expect, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentProviderFactory } from './payment-provider.factory.js';
import { StripeProvider } from './stripe/stripe.provider.js';
import { KushkiProvider } from './kushki/kushki.provider.js';
import { PayPhoneProvider } from './payphone/payphone.provider.js';
import { MercadoPagoProvider } from './mercadopago/mercadopago.provider.js';
import { PlaceToPayProvider } from './placetopay/placetopay.provider.js';
import { PaymentProvider as PaymentProviderEnum } from './payment-provider.enum.js';

const TEST_CONFIG = {
  DEFAULT_LOCAL_PAYMENT_PROVIDER: 'PLACETOPAY',
};

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
        { provide: ConfigService, useValue: new ConfigService(TEST_CONFIG) },
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

  it('resolves Stripe by default for non-local contexts', () => {
    expect(factory.resolveProvider({ country: 'US' })).toBe(stripeProvider);
  });

  it('resolves local provider by method for Ecuador orders', () => {
    expect(factory.resolveProvider({ country: 'Ecuador', method: 'kushki' })).toBe(kushkiProvider);
    expect(factory.resolveProvider({ country: 'EC', method: 'payphone' })).toBe(payPhoneProvider);
    expect(factory.resolveProvider({ country: 'Ecuador', method: 'mercadopago' })).toBe(mercadoPagoProvider);
    expect(factory.resolveProvider({ country: 'EC', method: 'placetopay' })).toBe(placeToPayProvider);
  });

  it('respects admin override', () => {
    expect(factory.resolveProvider({ country: 'Ecuador', method: 'kushki', adminOverride: 'STRIPE' })).toBe(stripeProvider);
  });

  it('maps provider instance back to enum name', () => {
    expect(factory.getProviderName(stripeProvider)).toBe(PaymentProviderEnum.STRIPE);
    expect(factory.getProviderName(kushkiProvider)).toBe(PaymentProviderEnum.KUSHKI);
    expect(factory.getProviderName(payPhoneProvider)).toBe(PaymentProviderEnum.PAYPHONE);
    expect(factory.getProviderName(mercadoPagoProvider)).toBe(PaymentProviderEnum.MERCADOPAGO);
    expect(factory.getProviderName(placeToPayProvider)).toBe(PaymentProviderEnum.PLACETOPAY);
  });
});
