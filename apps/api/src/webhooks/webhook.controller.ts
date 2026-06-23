import {
  Controller,
  Headers,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { createHash } from 'crypto';
import { Public } from '../auth/public.decorator.js';
import { WhatsAppProvider } from '../whatsapp/whatsapp-provider.interface.js';
import { RedisIdempotencyService } from '../common/redis/idempotency.service.js';
import { WebhookService, EvolutionWebhookPayload } from './webhook.service.js';

interface RawRequest extends Request {
  rawBody?: Buffer;
}

@ApiTags('Webhooks')
@Controller('webhooks/evolution')
@Public()
export class WebhookController {
  constructor(
    private readonly whatsappProvider: WhatsAppProvider,
    private readonly idempotency: RedisIdempotencyService,
    private readonly webhookService: WebhookService,
  ) {}

  @Post(':event')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Receive Evolution API webhook events' })
  @ApiResponse({ status: 204, description: 'Event accepted' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async handle(
    @Param('event') event: string,
    @Headers('x-evolution-api-signature') signature: string | undefined,
    @Req() request: RawRequest,
  ): Promise<void> {
    const rawBody = request.rawBody;

    if (!rawBody || !signature) {
      throw new UnauthorizedException('Missing webhook body or signature');
    }

    const valid = this.whatsappProvider.verifyWebhookSignature(rawBody, signature);

    if (!valid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    let payload: EvolutionWebhookPayload;

    try {
      payload = JSON.parse(rawBody.toString('utf8')) as EvolutionWebhookPayload;
    } catch {
      throw new UnauthorizedException('Invalid JSON payload');
    }

    const idempotencyKey = this.buildIdempotencyKey(event, rawBody);
    const isFirst = await this.idempotency.claim(idempotencyKey);

    if (!isFirst) {
      return;
    }

    await this.webhookService.handleEvent(event, payload);
  }

  private buildIdempotencyKey(event: string, rawBody: Buffer): string {
    const hash = createHash('sha256').update(rawBody).digest('hex');
    return `evolution:${event}:${hash}`;
  }
}
