import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resilientFetch } from '../common/resilience/resilient-fetch.js';

export interface EvolutionMessageKey {
  id?: string;
  remoteJid?: string;
  fromMe?: boolean;
}

interface EvolutionMediaResponse {
  base64?: string;
  mimetype?: string;
  mediaType?: string;
  fileName?: string;
  media?: {
    base64?: string;
    mimetype?: string;
  };
}

/**
 * Fetches WhatsApp media from Evolution API as base64.
 */
@Injectable()
export class EvolutionMediaService {
  private readonly logger = new Logger(EvolutionMediaService.name);

  constructor(private readonly configService: ConfigService) {}

  async fetchBase64(
    instance: string,
    messageKey: EvolutionMessageKey,
    message?: Record<string, unknown>,
    convertToMp4 = false,
  ): Promise<{ base64: string; mimetype: string }> {
    const url = `${this.baseUrl}/chat/getBase64FromMediaMessage/${instance}`;
    const response = await resilientFetch('evolution-api.media', url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        message: {
          key: messageKey,
          ...(message ? { message } : {}),
        },
        convertToMp4,
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(
        `Evolution getBase64FromMediaMessage returned ${response.status}: ${text || response.statusText}`,
      );
    }

    let data: EvolutionMediaResponse = {};
    try {
      data = JSON.parse(text) as EvolutionMediaResponse;
    } catch {
      throw new Error('Evolution getBase64FromMediaMessage returned invalid JSON');
    }

    const base64 = data.base64 ?? data.media?.base64;
    const mimetype =
      data.mimetype ??
      data.media?.mimetype ??
      (typeof data.mediaType === 'string' ? data.mediaType : undefined) ??
      'application/octet-stream';

    if (!base64) {
      this.logger.warn({ messageKey }, 'Evolution media response missing base64 payload');
      throw new Error('Evolution media response missing base64 payload');
    }

    return { base64, mimetype };
  }

  private get apiKey(): string {
    return this.configService.getOrThrow<string>('EVOLUTION_API_KEY');
  }

  private get baseUrl(): string {
    return this.configService.getOrThrow<string>('EVOLUTION_API_URL').replace(/\/$/, '');
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      apikey: this.apiKey,
    };
  }
}
