import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import type { SendWhatsAppResult, WhatsAppTemplate, MessageStatus } from '@repo/shared-types';
import { ecuadorPhoneSchema } from '@repo/shared-utils';
import { WhatsAppProvider } from '../whatsapp-provider.interface.js';
import { WhatsAppProviderError } from '../whatsapp-provider.error.js';

interface EvolutionSendResponse {
  key?: { id?: string };
  status?: string;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 5_000;

/**
 * Evolution API v2 adapter for the {@link WhatsAppProvider} port.
 *
 * Sends text and template messages via REST and verifies inbound webhook
 * signatures using HMAC-SHA256.
 */
@Injectable()
export class EvolutionApiProvider extends WhatsAppProvider {
  private readonly logger = new Logger(EvolutionApiProvider.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  async sendText(phone: string, text: string): Promise<SendWhatsAppResult> {
    const normalizedPhone = this.validatePhone(phone);
    this.logger.debug({ phone: maskPhone(normalizedPhone) }, 'Sending WhatsApp text message');

    const response = await this.fetchWithRetry(this.buildUrl('sendText'), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        number: normalizedPhone,
        text,
        options: { delay: 1_200 },
      }),
    });

    return this.parseSendResponse(response);
  }

  async sendTemplate(
    phone: string,
    template: WhatsAppTemplate,
    variables: Record<string, string>,
  ): Promise<SendWhatsAppResult> {
    const normalizedPhone = this.validatePhone(phone);
    this.logger.debug({ phone: maskPhone(normalizedPhone), template }, 'Sending WhatsApp template message');

    const response = await this.fetchWithRetry(this.buildUrl('sendTemplate'), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        number: normalizedPhone,
        template: template.toLowerCase(),
        language: 'es',
        components: Object.entries(variables).map(([, text]) => ({
          type: 'body',
          parameters: [{ type: 'text', text }],
        })),
      }),
    });

    return this.parseSendResponse(response);
  }

  verifyWebhookSignature(payload: unknown, signature: string): boolean {
    let body: Buffer;
    if (Buffer.isBuffer(payload)) {
      body = payload;
    } else if (typeof payload === 'string') {
      body = Buffer.from(payload, 'utf8');
    } else {
      return false;
    }

    try {
      const expected = createHmac('sha256', this.webhookSecret).update(body).digest('hex');
      const expectedBuf = Buffer.from(expected, 'hex');
      const actualBuf = Buffer.from(signature, 'hex');

      if (expectedBuf.length !== actualBuf.length) {
        return false;
      }

      return timingSafeEqual(expectedBuf, actualBuf);
    } catch (error) {
      this.logger.warn({ error }, 'Webhook signature verification failed');
      return false;
    }
  }

  private get apiKey(): string {
    return this.configService.getOrThrow<string>('EVOLUTION_API_KEY');
  }

  private get baseUrl(): string {
    return this.configService.getOrThrow<string>('EVOLUTION_API_URL');
  }

  private get instanceName(): string {
    return this.configService.getOrThrow<string>('EVOLUTION_INSTANCE_NAME');
  }

  private get webhookSecret(): string {
    return this.configService.getOrThrow<string>('EVOLUTION_WEBHOOK_SECRET');
  }

  private validatePhone(phone: string): string {
    const result = ecuadorPhoneSchema.safeParse(phone);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return result.data;
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      apikey: this.apiKey,
    };
  }

  private buildUrl(action: 'sendText' | 'sendTemplate'): string {
    const base = this.baseUrl.replace(/\/$/, '');
    return `${base}/message/${action}/${this.instanceName}`;
  }

  private async fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, init);

        if (this.isRetryable(response.status) && attempt < MAX_RETRIES - 1) {
          await this.delay(this.backoffMs(attempt));
          continue;
        }

        return response;
      } catch (error) {
        lastError = error;

        if (this.isNetworkError(error) && attempt < MAX_RETRIES - 1) {
          await this.delay(this.backoffMs(attempt));
          continue;
        }

        break;
      }
    }

    if (lastError instanceof Error) {
      throw new WhatsAppProviderError(
        `Evolution API request failed after ${MAX_RETRIES} attempts: ${lastError.message}`,
        true,
        'NETWORK_ERROR',
      );
    }

    throw new WhatsAppProviderError(
      `Evolution API request failed after ${MAX_RETRIES} attempts`,
      true,
      'MAX_RETRIES_EXCEEDED',
    );
  }

  private async parseSendResponse(response: Response): Promise<SendWhatsAppResult> {
    const text = await response.text();
    let data: EvolutionSendResponse = {};

    try {
      data = JSON.parse(text) as EvolutionSendResponse;
    } catch {
      // Non-JSON response; continue with status checks below.
    }

    if (!response.ok) {
      throw new WhatsAppProviderError(
        `Evolution API returned ${response.status}: ${text || response.statusText}`,
        this.isRetryable(response.status),
        String(data.status ?? response.status),
      );
    }

    return {
      providerMessageId: data.key?.id ?? `evolution-${Date.now()}`,
      status: this.mapStatus(data.status),
    };
  }

  private mapStatus(status?: string): MessageStatus {
    switch (status?.toUpperCase()) {
      case 'READ':
      case 'PLAYED':
        return 'READ';
      case 'DELIVERED':
      case 'DELIVERY_ACK':
        return 'DELIVERED';
      case 'FAILED':
        return 'FAILED';
      case 'SENT':
      case 'SERVER_ACK':
      case 'PENDING':
      default:
        return 'SENT';
    }
  }

  private isRetryable(status: number): boolean {
    return status >= 500 || status === 408 || status === 429;
  }

  private isNetworkError(error: unknown): boolean {
    return error instanceof TypeError || (error instanceof Error && error.message.includes('fetch'));
  }

  private backoffMs(attempt: number): number {
    return Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `***${digits.slice(-4)}`;
}
