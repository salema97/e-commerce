import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { PaymentProviderFactory } from './payment-provider.factory.js';
import { StripeProvider } from './stripe/stripe.provider.js';
import { StripeWebhookController } from './stripe/stripe-webhook.controller.js';
import { StripeWebhookService } from './stripe/stripe-webhook.service.js';
import { KushkiProvider } from './kushki/kushki.provider.js';
import { PayPhoneProvider } from './payphone/payphone.provider.js';
import { MercadoPagoProvider } from './mercadopago/mercadopago.provider.js';
import { PlaceToPayProvider } from './placetopay/placetopay.provider.js';
import { InvoicesModule } from '../invoices/invoices.module.js';

@Module({
  imports: [InvoicesModule],
  controllers: [StripeWebhookController],
  providers: [
    PaymentsService,
    PaymentProviderFactory,
    StripeProvider,
    StripeWebhookService,
    KushkiProvider,
    PayPhoneProvider,
    MercadoPagoProvider,
    PlaceToPayProvider,
  ],
  exports: [PaymentsService, PaymentProviderFactory],
})
export class PaymentsModule {}
