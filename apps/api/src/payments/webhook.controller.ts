import {
  Controller,
  Post,
  Param,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/public.decorator.js';
import { PaymentWebhookService } from './payment-webhook.service.js';

@Public()
@Throttle({ default: { limit: 1000, ttl: 60_000 } })
@Controller('webhooks/payments')
export class PaymentWebhookController {
  constructor(private readonly webhookService: PaymentWebhookService) {}

  @Post(':provider')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: unknown,
    @Headers('x-provider-signature') signature?: string,
  ): Promise<{ received: boolean; providerTransactionId: string; status: string }> {
    const result = await this.webhookService.handle(provider, payload, signature);
    return {
      received: true,
      providerTransactionId: result.providerTransactionId,
      status: result.status,
    };
  }
}
