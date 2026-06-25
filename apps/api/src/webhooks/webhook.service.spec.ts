import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { WebhookService, EvolutionWebhookPayload } from './webhook.service.js';
import { ConversationService } from '../conversations/conversation.service.js';
import { MessageService } from '../messages/message.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConversationOrchestrator } from '../ai/orchestrator/conversation-orchestrator.interface.js';
import { WhatsAppProvider } from '../whatsapp/whatsapp-provider.interface.js';
import { RedisIdempotencyService } from '../common/redis/idempotency.service.js';

describe('WebhookService', () => {
  let service: WebhookService;
  let conversationService: {
    findByRemoteJid: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let messageService: {
    createInbound: ReturnType<typeof vi.fn>;
    updateStatusByExternalId: ReturnType<typeof vi.fn>;
  };
  let prisma: {
    user: { updateMany: ReturnType<typeof vi.fn> };
  };
  let whatsappProvider: {
    verifyWebhookSignature: ReturnType<typeof vi.fn>;
  };
  let idempotency: {
    claim: ReturnType<typeof vi.fn>;
  };

  function mockConversationService() {
    return {
      findByRemoteJid: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
  }

  function mockMessageService() {
    return {
      createInbound: vi.fn().mockResolvedValue({ id: 'm1' }),
      updateStatusByExternalId: vi.fn().mockResolvedValue({ count: 1 }),
    };
  }

  function mockPrisma() {
    return {
      user: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    };
  }

  function makeMessagePayload(overrides: {
    remoteJid?: string;
    id?: string;
    fromMe?: boolean;
    content?: string;
    contentType?: string;
    pushName?: string;
    timestamp?: number;
  } = {}): EvolutionWebhookPayload {
    return {
      event: 'messages.upsert',
      instance: 'ecommerce',
      data: {
        key: {
          remoteJid: overrides.remoteJid ?? '+593991234567@s.whatsapp.net',
          id: overrides.id ?? 'msg-1',
          fromMe: overrides.fromMe ?? false,
        },
        pushName: overrides.pushName ?? 'Test Customer',
        message: overrides.contentType
          ? { [`${overrides.contentType}Message`]: overrides.content ?? '[media]' }
          : { conversation: overrides.content ?? 'Hola' },
        messageTimestamp: overrides.timestamp ?? Math.floor(Date.now() / 1000),
      },
    };
  }

  beforeEach(async () => {
    conversationService = mockConversationService();
    conversationService.findByRemoteJid.mockResolvedValue({ id: 'c1' });
    conversationService.create.mockResolvedValue({ id: 'c1' });
    conversationService.update.mockResolvedValue({ id: 'c1' });
    messageService = mockMessageService();
    prisma = mockPrisma();
    whatsappProvider = { verifyWebhookSignature: vi.fn().mockReturnValue(true) };
    idempotency = { claim: vi.fn().mockResolvedValue(true) };

    const module = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: ConversationService, useValue: conversationService },
        { provide: MessageService, useValue: messageService },
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConversationOrchestrator,
          useValue: { handleInbound: vi.fn().mockResolvedValue(undefined) },
        },
        { provide: WhatsAppProvider, useValue: whatsappProvider },
        { provide: RedisIdempotencyService, useValue: idempotency },
      ],
    }).compile();

    service = module.get(WebhookService);
  });

  describe('receiveEvolutionWebhook', () => {
    it('rejects requests with missing signature', async () => {
      const rawBody = Buffer.from(JSON.stringify({ event: 'messages.upsert', data: {} }));

      await expect(
        service.receiveEvolutionWebhook('messages.upsert', rawBody, undefined),
      ).rejects.toMatchObject({ name: 'UnauthorizedException' });
    });

    it('rejects requests with missing raw body', async () => {
      await expect(
        service.receiveEvolutionWebhook('messages.upsert', undefined, 'sig'),
      ).rejects.toMatchObject({ name: 'UnauthorizedException' });
    });

    it('rejects requests with invalid signature', async () => {
      whatsappProvider.verifyWebhookSignature.mockReturnValue(false);
      const rawBody = Buffer.from(JSON.stringify({ event: 'messages.upsert', data: {} }));

      await expect(
        service.receiveEvolutionWebhook('messages.upsert', rawBody, 'bad-sig'),
      ).rejects.toMatchObject({ name: 'UnauthorizedException' });
    });

    it('rejects requests with invalid JSON payload', async () => {
      const rawBody = Buffer.from('not-valid-json');

      await expect(
        service.receiveEvolutionWebhook('messages.upsert', rawBody, 'sig'),
      ).rejects.toMatchObject({ name: 'UnauthorizedException' });
    });

    it('rejects requests with an invalid webhook payload shape', async () => {
      const rawBody = Buffer.from(JSON.stringify({ event: 'unknown.event', data: {} }));

      await expect(
        service.receiveEvolutionWebhook('messages.upsert', rawBody, 'sig'),
      ).rejects.toMatchObject({ name: 'BadRequestException' });
    });

    it('returns early on duplicate payloads', async () => {
      idempotency.claim.mockResolvedValue(false);
      const rawBody = Buffer.from(JSON.stringify({ event: 'messages.upsert', data: {} }));
      const handleEventSpy = vi.spyOn(service, 'handleEvent').mockResolvedValue(undefined);

      await service.receiveEvolutionWebhook('messages.upsert', rawBody, 'sig');

      expect(handleEventSpy).not.toHaveBeenCalled();
    });

    it('processes valid inbound message events', async () => {
      const payload = { event: 'messages.upsert' as const, data: { key: { id: 'm1' } } };
      const rawBody = Buffer.from(JSON.stringify(payload));
      const handleEventSpy = vi.spyOn(service, 'handleEvent').mockResolvedValue(undefined);

      await service.receiveEvolutionWebhook('messages.upsert', rawBody, 'sig');

      expect(handleEventSpy).toHaveBeenCalledWith('messages.upsert', payload);
    });
  });

  describe('handleInboundMessage', () => {
    it('creates an inbound text message and conversation', async () => {
      conversationService.findByRemoteJid.mockResolvedValue(null);

      await service.handleEvent('messages.upsert', makeMessagePayload({ content: 'Hola' }));

      expect(conversationService.create).toHaveBeenCalledWith(
        expect.objectContaining({ remoteJid: '593991234567', instance: 'ecommerce' }),
      );
      expect(messageService.createInbound).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'c1',
          remoteJid: '593991234567',
          content: 'Hola',
          contentType: 'TEXT',
        }),
      );
    });

    it('returns early when remoteJid is missing', async () => {
      await service.handleEvent('messages.upsert', {
        event: 'messages.upsert',
        data: { key: { id: 'msg-1' } },
      });

      expect(conversationService.findByRemoteJid).not.toHaveBeenCalled();
      expect(messageService.createInbound).not.toHaveBeenCalled();
    });

    it('ignores messages sent from the business account (fromMe)', async () => {
      await service.handleEvent(
        'messages.upsert',
        makeMessagePayload({ fromMe: true, content: 'Outbound echo' }),
      );

      expect(conversationService.findByRemoteJid).not.toHaveBeenCalled();
      expect(messageService.createInbound).not.toHaveBeenCalled();
    });

    it('extracts media message content types', async () => {
      await service.handleEvent(
        'messages.upsert',
        makeMessagePayload({ contentType: 'image', content: '[image]' }),
      );

      expect(messageService.createInbound).toHaveBeenCalledWith(
        expect.objectContaining({ content: '[image]', contentType: 'IMAGE' }),
      );
    });

    it('sets opt-out flag on exact E.164 match', async () => {
      await service.handleEvent(
        'messages.upsert',
        makeMessagePayload({ content: 'BAJA' }),
      );

      expect(prisma.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { phone: '+593991234567' },
          data: { whatsappOptOut: true },
        }),
      );
    });

    it('does not opt-out when keyword does not match case-insensitively', async () => {
      await service.handleEvent(
        'messages.upsert',
        makeMessagePayload({ content: ' unsubscribe ' }),
      );

      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it('does not opt-out on substring match', async () => {
      prisma.user.updateMany.mockResolvedValue({ count: 0 });

      await service.handleEvent(
        'messages.upsert',
        makeMessagePayload({ content: 'baja' }),
      );

      expect(prisma.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { phone: '+593991234567' },
        }),
      );
    });
  });

  describe('handleStatusUpdate', () => {
    it('maps and forwards delivery status updates', async () => {
      await service.handleEvent('messages.update', {
        event: 'messages.update',
        data: {
          key: { id: 'ext1' },
          status: 'DELIVERED',
        },
      });

      expect(messageService.updateStatusByExternalId).toHaveBeenCalledWith(
        'ext1',
        'DELIVERED',
        'DELIVERED',
      );
    });

    it('ignores status updates missing the message id', async () => {
      await service.handleEvent('messages.update', {
        event: 'messages.update',
        data: { status: 'READ' },
      });

      expect(messageService.updateStatusByExternalId).not.toHaveBeenCalled();
    });

    it('ignores non-terminal status updates', async () => {
      await service.handleEvent('messages.update', {
        event: 'messages.update',
        data: {
          key: { id: 'ext1' },
          status: 'PENDING',
        },
      });

      expect(messageService.updateStatusByExternalId).not.toHaveBeenCalled();
    });
  });

  describe('handleConnectionUpdate', () => {
    it('logs connection updates without throwing', async () => {
      await expect(
        service.handleEvent('connection.update', {
          event: 'connection.update',
          data: { state: 'CONNECTED' },
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('findOrCreateConversation concurrency', () => {
    it('retries lookup after unique constraint violation', async () => {
      conversationService.findByRemoteJid
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'c2' });
      conversationService.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed',
          { code: 'P2002', clientVersion: '7.8.0' },
        ),
      );

      await service.handleEvent('messages.upsert', makeMessagePayload());

      expect(conversationService.findByRemoteJid).toHaveBeenCalledTimes(2);
      expect(messageService.createInbound).toHaveBeenCalledWith(
        expect.objectContaining({ conversationId: 'c2' }),
      );
    });
  });
});
