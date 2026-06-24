import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { ZodError } from 'zod';
import { MessageStatus, Prisma } from '@prisma/client';
import { ecuadorPhoneSchema, webhookPayloadSchema } from '@repo/shared-utils';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConversationService } from '../conversations/conversation.service.js';
import { MessageService } from '../messages/message.service.js';
import { ConversationOrchestrator } from '../ai/orchestrator/conversation-orchestrator.interface.js';
import { WhatsAppProvider } from '../whatsapp/whatsapp-provider.interface.js';
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
    private readonly idempotency: RedisIdempotencyService,
  ) {}

  async receiveEvolutionWebhook(
    event: string,
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ): Promise<void> {
    if (!rawBody || !signature) {
      throw new UnauthorizedException('Missing webhook body or signature');
    }

    const valid = this.whatsappProvider.verifyWebhookSignature(rawBody, signature);
    if (!valid) {
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

    await this.handleEvent(event, payload);
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
    const data = (payload.data ?? {}) as EvolutionMessage;
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
    const { content, contentType } = extractContent(data.message);

    const conversation = await this.findOrCreateConversation(phone, instance, data.pushName);

    await this.messageService.createInbound({
      conversationId: conversation.id,
      remoteJid: phone,
      instance,
      content,
      contentType,
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

function maskPhone(digits: string): string {
  return `***${digits.slice(-4)}`;
}

function normalizeRemoteJid(remoteJid: string): string {
  return remoteJid.split('@')[0]?.replace(/\D/g, '') ?? remoteJid;
}

function extractContent(
  message?: Record<string, unknown>,
): { content: string; contentType: Prisma.MessageCreateInput['contentType'] } {
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

  if (message.imageMessage) return { content: '[image]', contentType: 'IMAGE' };
  if (message.videoMessage) return { content: '[video]', contentType: 'VIDEO' };
  if (message.audioMessage) return { content: '[audio]', contentType: 'AUDIO' };
  if (message.documentMessage) return { content: '[document]', contentType: 'DOCUMENT' };
  if (message.locationMessage) return { content: '[location]', contentType: 'LOCATION' };

  return { content: '[unknown]', contentType: 'UNKNOWN' };
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
