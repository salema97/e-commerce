import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConversationService } from '../conversations/conversation.service.js';
import { WhatsAppProvider } from '../whatsapp/whatsapp-provider.interface.js';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { ListMessagesQueryDto } from './dto/list-messages.query.dto.js';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationService: ConversationService,
    private readonly whatsappProvider: WhatsAppProvider,
  ) {}

  async createInbound(data: {
    conversationId: string;
    remoteJid: string;
    instance?: string;
    content: string;
    contentType?: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'LOCATION' | 'UNKNOWN';
    mediaUrl?: string;
    externalMessageId?: string;
    externalStatus?: string;
    sentAt?: Date;
  }) {
    const message = await this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        remoteJid: data.remoteJid,
        instance: data.instance ?? 'ecommerce',
        direction: 'INBOUND',
        contentType: data.contentType ?? 'TEXT',
        content: data.content,
        mediaUrl: data.mediaUrl,
        externalMessageId: data.externalMessageId,
        externalStatus: data.externalStatus,
        sentAt: data.sentAt,
      },
    });

    await this.conversationService.touch(data.conversationId, 'INBOUND');

    return message;
  }

  async createOutbound(conversationId: string, dto: CreateMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with id ${conversationId} not found`);
    }

    let result:
      | { providerMessageId: string; status: import('@repo/shared-types').MessageStatus }
      | undefined;
    let status: MessageStatus = 'SENT';
    let errorMessage: string | undefined;

    try {
      result = await this.whatsappProvider.sendText(conversation.remoteJid, dto.content);
    } catch (error) {
      status = 'FAILED';
      errorMessage = error instanceof Error ? error.message : 'Unknown send error';
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        remoteJid: conversation.remoteJid,
        instance: conversation.instance,
        direction: 'OUTBOUND',
        contentType: 'TEXT',
        content: dto.content,
        status,
        externalMessageId: result?.providerMessageId,
        errorMessage,
      },
    });

    await this.conversationService.touch(conversationId, 'OUTBOUND');

    return message;
  }

  async findAllByConversation(conversationId: string, query: ListMessagesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatusByExternalId(
    externalMessageId: string,
    status: MessageStatus,
    externalStatus?: string,
  ) {
    const data: Prisma.MessageUpdateInput = {
      status,
      ...(externalStatus && { externalStatus }),
      ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
      ...(status === 'READ' && { readAt: new Date() }),
    };

    return this.prisma.message.updateMany({
      where: { externalMessageId },
      data,
    });
  }
}
