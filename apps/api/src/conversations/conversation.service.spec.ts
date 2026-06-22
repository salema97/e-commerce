import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConversationService } from './conversation.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('ConversationService', () => {
  let service: ConversationService;
  let prisma: ReturnType<typeof mockPrisma>;

  function mockPrisma() {
    return {
      conversation: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
    };
  }

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      providers: [
        ConversationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(ConversationService);
  });

  it('creates a conversation', async () => {
    prisma.conversation.create.mockResolvedValue({ id: 'c1' });
    const result = await service.create({ remoteJid: '593991234567', contactName: 'John' });
    expect(prisma.conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ remoteJid: '593991234567', contactName: 'John' }),
      }),
    );
    expect(result.id).toBe('c1');
  });

  it('finds conversations with status filter', async () => {
    prisma.conversation.findMany.mockResolvedValue([]);
    prisma.conversation.count.mockResolvedValue(0);

    await service.findAll({ status: 'OPEN' } as never);

    expect(prisma.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'OPEN' }) }),
    );
  });

  it('filters assignedToMe for current user', async () => {
    prisma.conversation.findMany.mockResolvedValue([]);
    prisma.conversation.count.mockResolvedValue(0);

    await service.findAll({ assignedToMe: 'true' } as never, 'u1');

    expect(prisma.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ assignedAgentId: 'u1' }) }),
    );
  });

  it('throws when conversation not found', async () => {
    prisma.conversation.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates status and assigned agent', async () => {
    prisma.conversation.findUnique.mockResolvedValue({ id: 'c1' });
    prisma.conversation.update.mockResolvedValue({ id: 'c1', status: 'PENDING' });

    const result = await service.update('c1', { status: 'PENDING', assignedAgentId: 'u1' });

    expect(prisma.conversation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PENDING', assignedAgentId: 'u1' }),
      }),
    );
    expect(result.status).toBe('PENDING');
  });

  it('touches lastMessageAt and increments unread on inbound', async () => {
    prisma.conversation.update.mockResolvedValue({ id: 'c1' });

    await service.touch('c1', 'INBOUND');

    expect(prisma.conversation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastMessageAt: expect.any(Date),
          unreadCount: { increment: 1 },
        }),
      }),
    );
  });
});
