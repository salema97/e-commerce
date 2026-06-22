import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { PaymentProviderFactory } from './payment-provider.factory.js';
import { StripeProvider } from './stripe/stripe.provider.js';
import { StripeWebhookController } from './stripe/stripe-webhook.controller.js';
import { StripeWebhookService } from './stripe/stripe-webhook.service.js';
import { StripeCustomerService } from './stripe/stripe-customer.service.js';
import { KushkiProvider } from './kushki/kushki.provider.js';
import { PayPhoneProvider } from './payphone/payphone.provider.js';
import { MercadoPagoProvider } from './mercadopago/mercadopago.provider.js';
import { PlaceToPayProvider } from './placetopay/placetopay.provider.js';
import { InvoicesModule } from '../invoices/invoices.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [InvoicesModule, InventoryModule, AuditModule],
  controllers: [StripeWebhookController],
  providers: [
    PaymentsService,
    PaymentProviderFactory,
    StripeProvider,
    StripeWebhookService,
    StripeCustomerService,
    KushkiProvider,
    PayPhoneProvider,
    MercadoPagoProvider,
    PlaceToPayProvider,
  ],
  exports: [PaymentsService, PaymentProviderFactory, StripeCustomerService],
})
export class PaymentsModule {}
