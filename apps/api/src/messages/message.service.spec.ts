import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MessageService } from './message.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConversationService } from '../conversations/conversation.service.js';
import { WhatsAppProvider } from '../whatsapp/whatsapp-provider.interface.js';

describe('MessageService', () => {
  let service: MessageService;
  let prisma: ReturnType<typeof mockPrisma>;
  let conversationService: ReturnType<typeof mockConversationService>;
  let provider: ReturnType<typeof mockProvider>;

  function mockPrisma() {
    return {
      conversation: {
        findUnique: vi.fn(),
      },
      message: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        updateMany: vi.fn(),
      },
    };
  }

  function mockConversationService() {
    return {
      touch: vi.fn(),
    };
  }

  function mockProvider() {
    return {
      sendText: vi.fn(),
    };
  }

  beforeEach(async () => {
    prisma = mockPrisma();
    conversationService = mockConversationService();
    provider = mockProvider();

    const module = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConversationService, useValue: conversationService },
        { provide: WhatsAppProvider, useValue: provider },
      ],
    }).compile();

    service = module.get(MessageService);
  });

  it('creates an inbound message and touches conversation', async () => {
    prisma.message.create.mockResolvedValue({ id: 'm1' });
    conversationService.touch.mockResolvedValue({ id: 'c1' });

    const result = await service.createInbound({
      conversationId: 'c1',
      remoteJid: '593991234567',
      content: 'Hola',
      externalMessageId: 'ext1',
    });

    expect(prisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ direction: 'INBOUND', content: 'Hola' }),
      }),
    );
    expect(conversationService.touch).toHaveBeenCalledWith('c1', 'INBOUND');
    expect(result.id).toBe('m1');
  });

  it('sends outbound message via provider and persists it', async () => {
    prisma.conversation.findUnique.mockResolvedValue({ id: 'c1', remoteJid: '593991234567', instance: 'ecommerce' });
    provider.sendText.mockResolvedValue({ providerMessageId: 'ext2', status: 'SENT' });
    prisma.message.create.mockResolvedValue({ id: 'm2' });
    conversationService.touch.mockResolvedValue({ id: 'c1' });

    const result = await service.createOutbound('c1', { content: 'Reply' });

    expect(provider.sendText).toHaveBeenCalledWith('593991234567', 'Reply');
    expect(prisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ direction: 'OUTBOUND', externalMessageId: 'ext2' }),
      }),
    );
    expect(result.id).toBe('m2');
  });

  it('marks outbound failed when provider throws', async () => {
    prisma.conversation.findUnique.mockResolvedValue({ id: 'c1', remoteJid: '593991234567', instance: 'ecommerce' });
    provider.sendText.mockRejectedValue(new Error('Network error'));
    prisma.message.create.mockResolvedValue({ id: 'm3' });
    conversationService.touch.mockResolvedValue({ id: 'c1' });

    const result = await service.createOutbound('c1', { content: 'Reply' });

    expect(prisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED', errorMessage: 'Network error' }),
      }),
    );
    expect(result.id).toBe('m3');
  });

  it('throws when creating outbound for unknown conversation', async () => {
    prisma.conversation.findUnique.mockResolvedValue(null);
    await expect(service.createOutbound('missing', { content: 'x' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('persists a pre-sent outbound message without calling the provider', async () => {
    prisma.message.create.mockResolvedValue({ id: 'm4' });
    conversationService.touch.mockResolvedValue({ id: 'c1' });

    const result = await service.persistOutbound({
      conversationId: 'c1',
      remoteJid: '593991234567',
      content: 'Notification',
      status: 'DELIVERED',
      externalMessageId: 'ext4',
    });

    expect(provider.sendText).not.toHaveBeenCalled();
    expect(prisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          direction: 'OUTBOUND',
          content: 'Notification',
          status: 'DELIVERED',
          externalMessageId: 'ext4',
        }),
      }),
    );
    expect(conversationService.touch).toHaveBeenCalledWith('c1', 'OUTBOUND');
    expect(result.id).toBe('m4');
  });

  it('lists messages by conversation ordered by createdAt asc', async () => {
    prisma.message.findMany.mockResolvedValue([]);
    prisma.message.count.mockResolvedValue(0);

    await service.findAllByConversation('c1', { page: 1, limit: 20 });

    expect(prisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { conversationId: 'c1' },
        orderBy: { createdAt: 'asc' },
      }),
    );
  });

  it('updates status by external message id', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'm1', status: 'SENT' });
    prisma.message.updateMany.mockResolvedValue({ count: 1 });

    await service.updateStatusByExternalId('ext1', 'READ', 'READ');

    expect(prisma.message.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { externalMessageId: 'ext1' },
        data: expect.objectContaining({ status: 'READ', readAt: expect.any(Date) }),
      }),
    );
  });

  it('does not downgrade an already-read message to delivered', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'm1', status: 'READ' });

    await service.updateStatusByExternalId('ext1', 'DELIVERED', 'DELIVERED');

    expect(prisma.message.updateMany).not.toHaveBeenCalled();
  });

  it('does not update status when current and new status are equal', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'm1', status: 'DELIVERED' });

    await service.updateStatusByExternalId('ext1', 'DELIVERED', 'DELIVERED');

    expect(prisma.message.updateMany).not.toHaveBeenCalled();
  });
});
