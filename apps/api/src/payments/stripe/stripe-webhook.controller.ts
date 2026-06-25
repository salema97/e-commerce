import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '../../auth/public.decorator.js';
import { StripeWebhookService } from './stripe-webhook.service.js';
import { PaymentWebhookResponseDto } from '../public-api.js';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@Public()
@Throttle({ default: { limit: 10, ttl: 60_000 } })
@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly webhookService: StripeWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() request: RawBodyRequest,
    @Headers('stripe-signature') signature: string,
  ): Promise<PaymentWebhookResponseDto> {
    if (!request.rawBody) {
      throw new BadRequestException('Raw body required for signature verification');
    }

    await this.webhookService.handleWebhook(request.rawBody, signature);

    return { received: true };
  }
}
