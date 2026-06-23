import {
  Controller,
  Post,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
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
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-provider-signature') signature?: string,
  ): Promise<{ received: boolean; providerTransactionId: string; status: string }> {
    const rawBody = req.rawBody ?? Buffer.from('');
    const result = await this.webhookService.handle(provider, rawBody, signature);
    return {
      received: true,
      providerTransactionId: result.providerTransactionId,
      status: result.status,
    };
  }
}
