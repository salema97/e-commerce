import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MessageService } from '../../messages/message.service.js';
import { ConversationOrchestrator } from '../orchestrator/conversation-orchestrator.interface.js';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messageService: MessageService,
    private readonly orchestrator: ConversationOrchestrator,
  ) {}

  async createSession(contactName?: string) {
    const webSessionId = randomUUID();
    return this.prisma.conversation.create({
      data: {
        remoteJid: `web:${webSessionId}`,
        instance: 'web',
        channel: 'WEB',
        webSessionId,
        contactName: contactName ?? 'Visitante web',
        status: 'OPEN',
        botEnabled: true,
      },
    });
  }

  async sendMessage(webSessionId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { webSessionId } });
    if (!conversation) {
      throw new NotFoundException('Chat session not found');
    }

    await this.messageService.createInbound({
      conversationId: conversation.id,
      remoteJid: conversation.remoteJid,
      instance: conversation.instance,
      content,
      contentType: 'TEXT',
    });

    void this.orchestrator.handleInbound({
      conversationId: conversation.id,
      channel: 'WEB',
      content,
    });

    return this.listMessages(webSessionId);
  }

  async listMessages(webSessionId: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { webSessionId } });
    if (!conversation) {
      throw new NotFoundException('Chat session not found');
    }

    return this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });
  }
}
