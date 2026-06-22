import {
  Controller,
  Post,
  Req,
  Headers,
  UnauthorizedException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/public.decorator.js';
import { ClerkWebhookService } from './clerk-webhook.service.js';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@Public()
@Throttle({ default: { limit: 10, ttl: 60_000 } })
@Controller('webhooks/clerk')
export class ClerkWebhookController {
  constructor(
    private configService: ConfigService,
    private webhookService: ClerkWebhookService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() request: RawBodyRequest,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ): Promise<{ success: boolean }> {
    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body required for signature verification');
    }

    const secret = this.configService.getOrThrow('CLERK_WEBHOOK_SECRET');
    if (
      !this.verifySignature(rawBody, {
        id: svixId,
        timestamp: svixTimestamp,
        signature: svixSignature,
      },
      secret)
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody.toString()) as { type: string; data: { id: string } };
    await this.webhookService.handleUserWebhook(payload);
    return { success: true };
  }

  private verifySignature(
    rawBody: Buffer,
    headers: { id: string; timestamp: string; signature: string },
    secret: string,
  ): boolean {
    const signedContent = `${headers.id}.${headers.timestamp}.${rawBody.toString()}`;
    const secretBytes = Buffer.from(secret.replace('whsec_', ''), 'base64');
    const computed = createHmac('sha256', secretBytes)
      .update(signedContent)
      .digest();

    const signatures = headers.signature
      .split(' ')
      .filter((part) => part.startsWith('v1,'))
      .map((part) => part.slice(3));

    for (const signature of signatures) {
      const expected = Buffer.from(signature, 'base64');
      if (
        expected.length === computed.length &&
        timingSafeEqual(expected, computed)
      ) {
        return true;
      }
    }
    return false;
  }
}
