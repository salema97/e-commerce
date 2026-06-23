import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageStatus } from '@prisma/client';
import type { SendWhatsAppResult, WhatsAppTemplate } from '@repo/shared-types';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConversationService } from '../conversations/conversation.service.js';
import { MessageService } from '../messages/message.service.js';
import { RedisIdempotencyService } from '../common/redis/idempotency.service.js';
import { WhatsAppProvider } from './whatsapp-provider.interface.js';
import { renderWhatsAppTemplate, type NotificationContext } from './whatsapp-templates.js';

export interface NotifyWhatsAppOptions {
  idempotencyKey?: string;
}

/**
 * Sends transactional WhatsApp notifications triggered by order, payment, and
 * refund lifecycle events. Notifications are idempotent, respect the customer's
 * WhatsApp opt-out flag, and are persisted in the Message table for the support
 * inbox.
 */
@Injectable()
export class WhatsAppNotificationService {
  private readonly logger = new Logger(WhatsAppNotificationService.name);

  constructor(
    private readonly whatsappProvider: WhatsAppProvider,
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly idempotency: RedisIdempotencyService,
  ) {}

  async notify(
    orderId: string,
    template: WhatsAppTemplate,
    phone: string,
    context: NotificationContext,
    options?: NotifyWhatsAppOptions,
  ): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.debug({ orderId, template }, 'WhatsApp notifications are disabled');
      return;
    }

    const rawPhone = formatPhone(phone);
    const phoneDigits = toDigits(rawPhone);

    if (!phoneDigits) {
      this.logger.warn({ orderId, template }, 'No valid phone number for WhatsApp notification');
      return;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      this.logger.warn({ orderId, template }, 'Order not found for WhatsApp notification');
      return;
    }

    const effectiveRawPhone = formatPhone(order.customerPhone ?? rawPhone);
    const effectiveDigits = toDigits(effectiveRawPhone);

    if (!effectiveDigits) {
      this.logger.warn({ orderId, template }, 'No phone number for WhatsApp notification');
      return;
    }

    if (order.user?.whatsappOptOut) {
      this.logger.debug(
        { orderId, template, userId: order.user.id },
        'Customer opted out of WhatsApp notifications',
      );
      return;
    }

    const idempotencyKey =
      options?.idempotencyKey ?? `wa:notification:${orderId}:${template}`;
    const claimed = await this.idempotency.claim(idempotencyKey, 60 * 60 * 24 * 7);

    if (!claimed) {
      this.logger.debug({ orderId, template }, 'Duplicate WhatsApp notification skipped');
      return;
    }

    const text = renderWhatsAppTemplate(template, context);

    let result: SendWhatsAppResult | undefined;
    let status: MessageStatus = 'SENT';
    let errorMessage: string | undefined;

    try {
      result = await this.whatsappProvider.sendText(effectiveRawPhone, text);
    } catch (error) {
      await this.idempotency.release(idempotencyKey);
      status = 'FAILED';
      errorMessage = error instanceof Error ? error.message : 'Unknown send error';
      this.logger.error(
        { error, orderId, template, phone: maskPhone(effectiveDigits) },
        'Failed to send WhatsApp notification',
      );
    }

    try {
      const conversation = await this.findOrCreateConversation(
        effectiveDigits,
        'ecommerce',
        order.userId,
      );

      await this.messageService.persistOutbound({
        conversationId: conversation.id,
        remoteJid: effectiveDigits,
        content: text,
        status: result ? mapProviderStatus(result.status) : status,
        externalMessageId: result?.providerMessageId ?? null,
        errorMessage,
      });
    } catch (error) {
      this.logger.error(
        { error, orderId, template },
        'Failed to persist WhatsApp notification message',
      );
    }
  }

  private isEnabled(): boolean {
    return this.configService.get<string>('WHATSAPP_NOTIFICATIONS_ENABLED') !== 'false';
  }

  private async findOrCreateConversation(
    remoteJid: string,
    instance: string,
    userId?: string | null,
  ) {
    const existing = await this.conversationService.findByRemoteJid(remoteJid, instance);

    if (existing) {
      return existing;
    }

    return this.conversationService.create({
      remoteJid,
      instance,
      status: 'OPEN',
      ...(userId ? { userId } : {}),
    });
  }
}

function formatPhone(phone: string): string {
  return phone.trim();
}

function toDigits(phone: string): string | undefined {
  const digits = phone.replace(/\D/g, '');
  return digits.length > 0 ? digits : undefined;
}

function maskPhone(digits: string): string {
  return `***${digits.slice(-4)}`;
}

function mapProviderStatus(status: SendWhatsAppResult['status']): MessageStatus {
  switch (status) {
    case 'DELIVERED':
      return 'DELIVERED';
    case 'READ':
      return 'READ';
    case 'FAILED':
      return 'FAILED';
    case 'SENT':
    default:
      return 'SENT';
  }
}
