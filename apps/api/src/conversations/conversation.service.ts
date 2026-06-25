import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ecuadorPhoneSchema } from '@repo/shared-utils';
import { PrismaService } from '../prisma/prisma.service.js';
import { ListConversationsQueryDto } from './dto/list-conversations.query.dto.js';
import { UpdateConversationDto } from './dto/update-conversation.dto.js';

@Injectable()
export class ConversationService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    remoteJid: string;
    instance?: string;
    contactName?: string;
    status?: 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
  }) {
    const phoneValidation = ecuadorPhoneSchema.safeParse(data.remoteJid);
    if (!phoneValidation.success) {
      throw new BadRequestException(phoneValidation.error.flatten());
    }

    return this.prisma.conversation.create({
      data: {
        remoteJid: data.remoteJid,
        instance: data.instance ?? 'ecommerce',
        contactName: data.contactName,
        status: data.status ?? 'OPEN',
      },
    });
  }

  findByRemoteJid(remoteJid: string, instance: string) {
    return this.prisma.conversation.findFirst({
      where: { remoteJid, instance },
    });
  }

  async findAll(query: ListConversationsQueryDto, currentUserId?: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ConversationWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.assignedToMe === 'true' && currentUserId) {
      where.assignedAgentId = currentUserId;
    } else if (query.assignedToMe === 'false') {
      where.assignedAgentId = null;
    }

    if (query.search) {
      const search = { contains: query.search, mode: 'insensitive' as const };
      where.OR = [
        { remoteJid: search },
        { contactName: search },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.conversation.count({ where }),
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

  async findOne(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with id ${id} not found`);
    }

    return conversation;
  }

  async update(
    id: string,
    data: UpdateConversationDto & { contactName?: string },
  ) {
    await this.findOne(id);

    return this.prisma.conversation.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.assignedAgentId !== undefined && {
          assignedAgentId: data.assignedAgentId,
        }),
        ...(data.contactName !== undefined && { contactName: data.contactName }),
      },
    });
  }

  touch(id: string, direction: 'INBOUND' | 'OUTBOUND') {
    const update: Prisma.ConversationUpdateInput = {
      lastMessageAt: new Date(),
    };

    if (direction === 'INBOUND') {
      update.unreadCount = { increment: 1 };
    }

    return this.prisma.conversation.update({
      where: { id },
      data: update,
    });
  }
}
