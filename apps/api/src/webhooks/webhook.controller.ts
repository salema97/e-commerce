import { Controller, Headers, HttpCode, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '../auth/public.decorator.js';
import { WebhookService } from './webhook.service.js';

interface RawRequest extends Request {
  rawBody?: Buffer;
}

@ApiTags('Webhooks')
@Controller('webhooks/evolution')
@Public()
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post(':event')
  @HttpCode(204)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Receive Evolution API webhook events' })
  @ApiResponse({ status: 204, description: 'Event accepted' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async handle(
    @Param('event') event: string,
    @Headers('x-evolution-api-signature') signature: string | undefined,
    @Headers('x-webhook-secret') webhookSecret: string | undefined,
    @Req() request: RawRequest,
  ): Promise<void> {
    await this.webhookService.receiveEvolutionWebhook(
      event,
      request.rawBody,
      signature,
      webhookSecret,
    );
  }
}
