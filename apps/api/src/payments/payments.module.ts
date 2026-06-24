import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { RefundService } from './refund.service.js';
import { PaymentProviderFactory } from './payment-provider.factory.js';
import { PaymentWebhookService } from './payment-webhook.service.js';
import { PaymentWebhookController } from './webhook.controller.js';
import { PaymentsController } from './payments.controller.js';
import { TestPaymentsController } from './test-payments.controller.js';
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
import { WhatsAppNotificationModule } from '../whatsapp/whatsapp-notification.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SriQueueModule } from '../invoices/sri/sri-queue.module.js';
import { isNonProduction } from '../common/is-non-production.js';

@Module({
  imports: [
    InvoicesModule,
    SriQueueModule,
    InventoryModule,
    AuditModule,
    WhatsAppNotificationModule,
    NotificationsModule,
  ],
  controllers: [
    StripeWebhookController,
    PaymentWebhookController,
    PaymentsController,
    ...(isNonProduction() ? [TestPaymentsController] : []),
  ],
  providers: [
    PaymentsService,
    RefundService,
    PaymentProviderFactory,
    PaymentWebhookService,
    StripeProvider,
    StripeWebhookService,
    StripeCustomerService,
    KushkiProvider,
    PayPhoneProvider,
    MercadoPagoProvider,
    PlaceToPayProvider,
  ],
  exports: [
    PaymentsService,
    RefundService,
    PaymentProviderFactory,
    StripeCustomerService,
    PaymentWebhookService,
  ],
})
export class PaymentsModule {}
