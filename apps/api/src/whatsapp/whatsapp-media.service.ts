import { Injectable, Logger } from '@nestjs/common';
import { StorageService } from '../storage/storage.service.js';
import { EvolutionMediaService, type EvolutionMessageKey } from './evolution-media.service.js';

type StorableContentType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';

@Injectable()
export class WhatsAppMediaService {
  private readonly logger = new Logger(WhatsAppMediaService.name);

  constructor(
    private readonly evolutionMedia: EvolutionMediaService,
    private readonly storage: StorageService,
  ) {}

  async storeInboundMedia(params: {
    instance: string;
    messageKey: EvolutionMessageKey;
    message?: Record<string, unknown>;
    conversationId: string;
    externalMessageId: string;
    mimetype?: string;
    inlineBase64?: string;
    contentType: StorableContentType;
  }): Promise<string | undefined> {
    try {
      let base64 = params.inlineBase64;
      let mimetype = params.mimetype ?? defaultMimetype(params.contentType);

      if (!base64) {
        const fetched = await this.evolutionMedia.fetchBase64(
          params.instance,
          params.messageKey,
          params.message,
          params.contentType === 'VIDEO',
        );
        base64 = fetched.base64;
        mimetype = fetched.mimetype ?? mimetype;
      }

      const buffer = Buffer.from(base64, 'base64');
      const extension = extensionFromMimetype(mimetype);
      const key = `whatsapp/${params.conversationId}/${params.externalMessageId}${extension}`;

      await this.storage.uploadBuffer(key, buffer, mimetype);
      return key;
    } catch (error) {
      this.logger.warn(
        {
          error,
          conversationId: params.conversationId,
          externalMessageId: params.externalMessageId,
          contentType: params.contentType,
        },
        'Failed to store inbound WhatsApp media',
      );
      return undefined;
    }
  }
}

function defaultMimetype(contentType: StorableContentType): string {
  switch (contentType) {
    case 'IMAGE':
      return 'image/jpeg';
    case 'VIDEO':
      return 'video/mp4';
    case 'AUDIO':
      return 'audio/ogg';
    case 'DOCUMENT':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

function extensionFromMimetype(mimetype: string): string {
  const normalized = mimetype.split(';')[0]?.trim().toLowerCase() ?? '';
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'video/mp4': '.mp4',
    'video/3gpp': '.3gp',
    'audio/ogg': '.ogg',
    'audio/mpeg': '.mp3',
    'audio/mp4': '.m4a',
    'application/pdf': '.pdf',
  };

  return map[normalized] ?? '';
}
