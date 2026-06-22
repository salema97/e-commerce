import { Module } from '@nestjs/common';
import { ClerkWebhookController } from './clerk-webhook.controller.js';
import { ClerkWebhookService } from './clerk-webhook.service.js';
import { PaymentsModule } from '../payments/payments.module.js';

@Module({
  imports: [PaymentsModule],
  controllers: [ClerkWebhookController],
  providers: [ClerkWebhookService],
})
export class ClerkModule {}
