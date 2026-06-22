import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WhatsAppNotificationService } from './whatsapp-notification.service.js';
import { WhatsAppProvider } from './whatsapp-provider.interface.js';
import { MessageService } from '../messages/message.service.js';
import { ConversationService } from '../conversations/conversation.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisIdempotencyService } from '../common/redis/idempotency.service.js';

describe('WhatsAppNotificationService', () => {
  let service: WhatsAppNotificationService;
  let provider: { sendText: ReturnType<typeof vi.fn> };
  let messageService: { persistOutbound: ReturnType<typeof vi.fn> };
  let conversationService: {
    findByRemoteJid: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  let prisma: {
    order: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };
  let configService: { get: ReturnType<typeof vi.fn> };
  let idempotency: { claim: ReturnType<typeof vi.fn> };

  function mockOrder(overrides: Partial<{
    id: string;
    orderNumber: string;
    customerPhone: string | null;
    total: number;
    userId: string | null;
    user: { whatsappOptOut: boolean } | null;
  }> = {}) {
    return {
      id: 'o1',
      orderNumber: 'ORD-1',
      customerPhone: '+593991234567',
      total: 45.98,
      userId: 'u1',
      user: { whatsappOptOut: false },
      ...overrides,
    };
  }

  beforeEach(async () => {
    provider = { sendText: vi.fn() };
    messageService = { persistOutbound: vi.fn().mockResolvedValue({ id: 'm1' }) };
    conversationService = {
      findByRemoteJid: vi.fn(),
      create: vi.fn(),
    };
    prisma = {
      order: { findUnique: vi.fn() },
    };
    configService = { get: vi.fn(() => 'true') };
    idempotency = { claim: vi.fn().mockResolvedValue(true) };

    const module = await Test.createTestingModule({
      providers: [
        WhatsAppNotificationService,
        { provide: WhatsAppProvider, useValue: provider },
        { provide: MessageService, useValue: messageService },
        { provide: ConversationService, useValue: conversationService },
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
        { provide: RedisIdempotencyService, useValue: idempotency },
      ],
    }).compile();

    service = module.get(WhatsAppNotificationService);
  });

  it('sends an ORDER_CONFIRMED notification and persists the message', async () => {
    prisma.order.findUnique.mockResolvedValue(mockOrder());
    provider.sendText.mockResolvedValue({ providerMessageId: 'ext1', status: 'SENT' });
    conversationService.findByRemoteJid.mockResolvedValue({ id: 'c1' });

    await service.notify('o1', 'ORDER_CONFIRMED', '+593991234567', {
      customerName: 'Cliente',
      orderNumber: 'ORD-1',
      total: 'USD 45.98',
    });

    expect(idempotency.claim).toHaveBeenCalledWith('wa:notification:o1:ORDER_CONFIRMED', expect.any(Number));
    expect(provider.sendText).toHaveBeenCalledWith(
      '+593991234567',
      expect.stringContaining('ORD-1'),
    );
    expect(messageService.persistOutbound).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'c1',
        remoteJid: '593991234567',
        status: 'SENT',
        externalMessageId: 'ext1',
      }),
    );
  });

  it('skips when notifications are disabled', async () => {
    configService.get.mockReturnValue('false');

    await service.notify('o1', 'ORDER_CONFIRMED', '+593991234567', {
      customerName: 'Cliente',
      orderNumber: 'ORD-1',
      total: 'USD 45.98',
    });

    expect(idempotency.claim).not.toHaveBeenCalled();
    expect(provider.sendText).not.toHaveBeenCalled();
  });

  it('skips when the phone number is invalid', async () => {
    await service.notify('o1', 'ORDER_CONFIRMED', 'abc', {
      customerName: 'Cliente',
      orderNumber: 'ORD-1',
      total: 'USD 45.98',
    });

    expect(idempotency.claim).not.toHaveBeenCalled();
    expect(provider.sendText).not.toHaveBeenCalled();
  });

  it('skips duplicate sends for the same order and template', async () => {
    idempotency.claim.mockResolvedValue(false);

    await service.notify('o1', 'ORDER_CONFIRMED', '+593991234567', {
      customerName: 'Cliente',
      orderNumber: 'ORD-1',
      total: 'USD 45.98',
    });

    expect(prisma.order.findUnique).not.toHaveBeenCalled();
    expect(provider.sendText).not.toHaveBeenCalled();
  });

  it('skips when the customer opted out', async () => {
    prisma.order.findUnique.mockResolvedValue(mockOrder({ user: { whatsappOptOut: true } }));

    await service.notify('o1', 'ORDER_CONFIRMED', '+593991234567', {
      customerName: 'Cliente',
      orderNumber: 'ORD-1',
      total: 'USD 45.98',
    });

    expect(provider.sendText).not.toHaveBeenCalled();
    expect(messageService.persistOutbound).not.toHaveBeenCalled();
  });

  it('creates a conversation when one does not exist', async () => {
    prisma.order.findUnique.mockResolvedValue(mockOrder());
    provider.sendText.mockResolvedValue({ providerMessageId: 'ext2', status: 'SENT' });
    conversationService.findByRemoteJid.mockResolvedValue(null);
    conversationService.create.mockResolvedValue({ id: 'c2' });

    await service.notify('o1', 'ORDER_SHIPPED', '+593991234567', {
      customerName: 'Cliente',
      orderNumber: 'ORD-1',
      carrier: 'Carrier',
      trackingNumber: 'TRACK-1',
    });

    expect(conversationService.create).toHaveBeenCalledWith(
      expect.objectContaining({ remoteJid: '593991234567', instance: 'ecommerce', userId: 'u1' }),
    );
    expect(messageService.persistOutbound).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 'c2' }),
    );
  });

  it('persists a FAILED message when the provider throws', async () => {
    prisma.order.findUnique.mockResolvedValue(mockOrder());
    provider.sendText.mockRejectedValue(new Error('Evolution API timeout'));
    conversationService.findByRemoteJid.mockResolvedValue({ id: 'c1' });

    await expect(
      service.notify('o1', 'PAYMENT_FAILED', '+593991234567', {
        customerName: 'Cliente',
        orderNumber: 'ORD-1',
        total: 'USD 45.98',
      }),
    ).resolves.toBeUndefined();

    expect(messageService.persistOutbound).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'FAILED',
        errorMessage: 'Evolution API timeout',
      }),
    );
  });

  it('sends an ORDER_DELIVERED notification and persists the message', async () => {
    prisma.order.findUnique.mockResolvedValue(mockOrder());
    provider.sendText.mockResolvedValue({ providerMessageId: 'ext4', status: 'SENT' });
    conversationService.findByRemoteJid.mockResolvedValue({ id: 'c1' });

    await service.notify('o1', 'ORDER_DELIVERED', '+593991234567', {
      customerName: 'Cliente',
      orderNumber: 'ORD-1',
    });

    expect(provider.sendText).toHaveBeenCalledWith(
      '+593991234567',
      expect.stringContaining('entregado'),
    );
    expect(messageService.persistOutbound).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'c1',
        status: 'SENT',
        externalMessageId: 'ext4',
      }),
    );
  });

  it('sends a REFUND_CONFIRMED notification and persists the message', async () => {
    prisma.order.findUnique.mockResolvedValue(mockOrder());
    provider.sendText.mockResolvedValue({ providerMessageId: 'ext5', status: 'SENT' });
    conversationService.findByRemoteJid.mockResolvedValue({ id: 'c1' });

    await service.notify('o1', 'REFUND_CONFIRMED', '+593991234567', {
      customerName: 'Cliente',
      orderNumber: 'ORD-1',
      amount: 'USD 45.98',
      refundMethod: 'Tarjeta de crédito',
    });

    expect(provider.sendText).toHaveBeenCalledWith(
      '+593991234567',
      expect.stringContaining('reembolso'),
    );
    expect(messageService.persistOutbound).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'c1',
        status: 'SENT',
        externalMessageId: 'ext5',
      }),
    );
  });

  it('does not throw when persistence fails', async () => {
    prisma.order.findUnique.mockResolvedValue(mockOrder());
    provider.sendText.mockResolvedValue({ providerMessageId: 'ext3', status: 'SENT' });
    conversationService.findByRemoteJid.mockResolvedValue({ id: 'c1' });
    messageService.persistOutbound.mockRejectedValue(new Error('DB down'));

    await expect(
      service.notify('o1', 'ORDER_DELIVERED', '+593991234567', {
        customerName: 'Cliente',
        orderNumber: 'ORD-1',
      }),
    ).resolves.toBeUndefined();
  });
});
