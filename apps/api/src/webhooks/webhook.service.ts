import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';
import { ZodError } from 'zod';
import { MessageStatus, Prisma } from '@prisma/client';
import { ecuadorPhoneSchema, webhookPayloadSchema } from '@repo/shared-utils';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConversationService } from '../conversations/conversation.service.js';
import { MessageService } from '../messages/message.service.js';
import { ConversationOrchestrator } from '../ai/orchestrator/conversation-orchestrator.interface.js';
import { WhatsAppProvider } from '../whatsapp/whatsapp-provider.interface.js';
import { WhatsAppMediaService } from '../whatsapp/whatsapp-media.service.js';
import { RedisIdempotencyService } from '../common/redis/idempotency.service.js';

export interface EvolutionWebhookPayload {
  event?: string;
  instance?: string;
  data?: unknown;
}

interface EvolutionMessageKey {
  remoteJid?: string;
  id?: string;
  fromMe?: boolean;
}

interface EvolutionMessage {
  key?: EvolutionMessageKey;
  pushName?: string;
  message?: Record<string, unknown>;
  messageTimestamp?: number;
}

interface EvolutionStatusUpdate {
  key?: EvolutionMessageKey;
  status?: string;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly prisma: PrismaService,
    private readonly orchestrator: ConversationOrchestrator,
    private readonly whatsappProvider: WhatsAppProvider,
    private readonly whatsAppMedia: WhatsAppMediaService,
    private readonly idempotency: RedisIdempotencyService,
    private readonly configService: ConfigService,
  ) {}

  async receiveEvolutionWebhook(
    event: string,
    rawBody: Buffer | undefined,
    signature: string | undefined,
    webhookSecretHeader: string | undefined,
  ): Promise<void> {
    if (!rawBody) {
      throw new UnauthorizedException('Missing webhook body');
    }

    if (!this.verifyWebhookAuth(rawBody, signature, webhookSecretHeader)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    let payload: EvolutionWebhookPayload;
    try {
      payload = webhookPayloadSchema.parse(
        JSON.parse(rawBody.toString('utf8')),
      ) as EvolutionWebhookPayload;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException(error.flatten());
      }
      throw new UnauthorizedException('Invalid JSON payload');
    }

    const hash = createHash('sha256').update(rawBody).digest('hex');
    const idempotencyKey = `evolution:${event}:${hash}`;
    const isFirst = await this.idempotency.claim(idempotencyKey);
    if (!isFirst) {
      return;
    }

    await this.handleEvent(normalizeEvolutionEvent(event), payload);
  }

  private verifyWebhookAuth(
    rawBody: Buffer,
    signature: string | undefined,
    webhookSecretHeader: string | undefined,
  ): boolean {
    if (signature) {
      return this.whatsappProvider.verifyWebhookSignature(rawBody, signature);
    }

    if (!webhookSecretHeader) {
      return false;
    }

    const expected = this.configService.getOrThrow<string>('EVOLUTION_WEBHOOK_SECRET');
    try {
      const actualBuf = Buffer.from(webhookSecretHeader);
      const expectedBuf = Buffer.from(expected);
      if (actualBuf.length !== expectedBuf.length) {
        return false;
      }
      return timingSafeEqual(actualBuf, expectedBuf);
    } catch {
      return false;
    }
  }

  async handleEvent(event: string, payload: EvolutionWebhookPayload): Promise<void> {
    switch (event) {
      case 'messages.upsert':
        await this.handleInboundMessage(payload);
        break;
      case 'messages.update':
        await this.handleStatusUpdate(payload);
        break;
      case 'connection.update':
        this.handleConnectionUpdate(payload);
        break;
      default:
        this.logger.debug({ event }, 'Unhandled Evolution webhook event');
    }
  }

  private async handleInboundMessage(payload: EvolutionWebhookPayload) {
    const data = (payload.data ?? {}) as EvolutionMessage & { base64?: string };
    const remoteJid = data.key?.remoteJid;
    const externalMessageId = data.key?.id;

    if (!remoteJid || !externalMessageId) {
      this.logger.warn(
        { event: payload.event },
        'Inbound message webhook missing remoteJid or message id',
      );
      return;
    }

    if (data.key?.fromMe === true) {
      this.logger.debug(
        { event: payload.event, externalMessageId },
        'Ignoring outbound message echo',
      );
      return;
    }

    const instance = payload.instance ?? 'ecommerce';
    const phone = normalizeRemoteJid(remoteJid);
    const { content, contentType, mimetype } = extractContent(data.message);

    const conversation = await this.findOrCreateConversation(phone, instance, data.pushName);

    let mediaUrl: string | undefined;
    if (isStorableMedia(contentType) && data.key) {
      mediaUrl = await this.whatsAppMedia.storeInboundMedia({
        instance,
        messageKey: data.key,
        message: data.message,
        conversationId: conversation.id,
        externalMessageId,
        mimetype,
        inlineBase64: typeof data.base64 === 'string' ? data.base64 : undefined,
        contentType,
      });
    }

    await this.messageService.createInbound({
      conversationId: conversation.id,
      remoteJid: phone,
      instance,
      content,
      contentType,
      mediaUrl,
      externalMessageId,
      sentAt: data.messageTimestamp ? new Date(data.messageTimestamp * 1000) : new Date(),
    });

    await this.handleOptOut(phone, content);

    if (contentType === 'TEXT' && content.trim()) {
      void this.orchestrator
        .handleInbound({
          conversationId: conversation.id,
          channel: 'WHATSAPP',
          content,
          phoneDigits: phone,
        })
        .catch((error: unknown) => {
        this.logger.error({ error, conversationId: conversation.id }, 'Support bot processing failed');
      });
    }
  }

  private async handleStatusUpdate(payload: EvolutionWebhookPayload) {
    const data = (payload.data ?? {}) as EvolutionStatusUpdate;
    const externalMessageId = data.key?.id;

    if (!externalMessageId) {
      this.logger.warn(
        { event: payload.event },
        'Status update webhook missing message id',
      );
      return;
    }

    const status = mapStatus(data.status);
    if (!status) {
      this.logger.debug(
        { status: data.status, externalMessageId },
        'Ignoring non-terminal status update',
      );
      return;
    }

    await this.messageService.updateStatusByExternalId(
      externalMessageId,
      status,
      data.status,
    );
  }

  private handleConnectionUpdate(payload: EvolutionWebhookPayload) {
    this.logger.debug(
      { state: (payload.data as Record<string, unknown>)?.state },
      'Evolution connection status update',
    );
  }

  private async handleOptOut(phoneDigits: string, content: string): Promise<void> {
    const optOutKeywords = ['baja', 'stop', 'no mas'];
    const normalizedContent = content.trim().toLowerCase().replace(/\s+/g, ' ');

    if (!optOutKeywords.includes(normalizedContent)) {
      return;
    }

    const parsed = ecuadorPhoneSchema.safeParse(phoneDigits);
    if (!parsed.success) {
      this.logger.debug(
        { phone: maskPhone(phoneDigits) },
        'Skipping opt-out for invalid phone number',
      );
      return;
    }

    const e164Phone = parsed.data;

    try {
      const { count } = await this.prisma.user.updateMany({
        where: {
          phone: e164Phone,
        },
        data: {
          whatsappOptOut: true,
        },
      });

      if (count > 0) {
        this.logger.log(
          { phone: maskPhone(phoneDigits), count },
          'Customer opted out of WhatsApp notifications',
        );
      }
    } catch (error) {
      this.logger.error(
        { error, phone: maskPhone(phoneDigits) },
        'Failed to update WhatsApp opt-out flag',
      );
    }
  }

  private async findOrCreateConversation(
    remoteJid: string,
    instance: string,
    contactName?: string,
  ) {
    const existing = await this.conversationService.findByRemoteJid(remoteJid, instance);

    if (existing) {
      if (contactName && !existing.contactName) {
        return this.conversationService.update(existing.id, { contactName });
      }
      return existing;
    }

    try {
      return await this.conversationService.create({
        remoteJid,
        instance,
        contactName,
        status: 'OPEN',
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const retry = await this.conversationService.findByRemoteJid(remoteJid, instance);
        if (retry) {
          return retry;
        }
      }
      throw error;
    }
  }
}

/** Evolution `webhookByEvents` uses kebab-case paths (e.g. messages-upsert). */
export function normalizeEvolutionEvent(event: string): string {
  return event.replace(/-/g, '.');
}

function maskPhone(digits: string): string {
  return `***${digits.slice(-4)}`;
}

function normalizeRemoteJid(remoteJid: string): string {
  return remoteJid.split('@')[0]?.replace(/\D/g, '') ?? remoteJid;
}

function extractContent(
  message?: Record<string, unknown>,
): {
  content: string;
  contentType: Prisma.MessageCreateInput['contentType'];
  mimetype?: string;
} {
  if (!message) {
    return { content: '', contentType: 'UNKNOWN' };
  }

  if (typeof message.conversation === 'string') {
    return { content: message.conversation, contentType: 'TEXT' };
  }

  if (typeof message.extendedTextMessage === 'object' && message.extendedTextMessage !== null) {
    const text = (message.extendedTextMessage as Record<string, unknown>).text;
    if (typeof text === 'string') {
      return { content: text, contentType: 'TEXT' };
    }
  }

  if (message.imageMessage) {
    return extractMediaMessage(message.imageMessage, 'IMAGE', '[image]');
  }
  if (message.videoMessage) {
    return extractMediaMessage(message.videoMessage, 'VIDEO', '[video]');
  }
  if (message.audioMessage) {
    return extractMediaMessage(message.audioMessage, 'AUDIO', '[audio]');
  }
  if (message.documentMessage) {
    return extractMediaMessage(message.documentMessage, 'DOCUMENT', '[document]');
  }
  if (message.locationMessage) return { content: '[location]', contentType: 'LOCATION' };

  return { content: '[unknown]', contentType: 'UNKNOWN' };
}

function extractMediaMessage(
  media: unknown,
  contentType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT',
  fallback: string,
): { content: string; contentType: typeof contentType; mimetype?: string } {
  const record = typeof media === 'object' && media !== null ? (media as Record<string, unknown>) : {};
  const caption = typeof record.caption === 'string' ? record.caption.trim() : '';
  const mimetype = typeof record.mimetype === 'string' ? record.mimetype : undefined;

  return {
    content: caption || fallback,
    contentType,
    mimetype,
  };
}

function isStorableMedia(
  contentType: Prisma.MessageCreateInput['contentType'],
): contentType is 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' {
  return (
    contentType === 'IMAGE' ||
    contentType === 'VIDEO' ||
    contentType === 'AUDIO' ||
    contentType === 'DOCUMENT'
  );
}

function mapStatus(status?: string): MessageStatus | null {
  switch (status?.toUpperCase()) {
    case 'READ':
    case 'PLAYED':
      return 'READ';
    case 'DELIVERED':
    case 'DELIVERY_ACK':
      return 'DELIVERED';
    case 'FAILED':
      return 'FAILED';
    default:
      return null;
  }
}
