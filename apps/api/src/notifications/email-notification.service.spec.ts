import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { EmailNotificationService } from './email-notification.service.js';
import { EmailProvider } from './email-provider.interface.js';

describe('EmailNotificationService', () => {
  let service: EmailNotificationService;
  let emailProvider: { sendTemplate: ReturnType<typeof vi.fn> };
  let prisma: {
    order: { findUnique: ReturnType<typeof vi.fn> };
  };
  let idempotency: { claim: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    emailProvider = { sendTemplate: vi.fn() };
    prisma = { order: { findUnique: vi.fn() } };
    idempotency = { claim: vi.fn().mockResolvedValue(true) };
    const config = {
      get: (key: string) => (key === 'EMAIL_NOTIFICATIONS_ENABLED' ? 'true' : undefined),
    } as unknown as ConfigService;

    service = new EmailNotificationService(
      emailProvider as unknown as EmailProvider,
      prisma as never,
      config,
      idempotency as never,
    );
  });

  it('sends order confirmed email', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      customerEmail: 'buyer@example.com',
      user: { emailOptOut: false },
    });

    await service.notify('o1', 'ORDER_CONFIRMED', 'buyer@example.com', {
      customerName: 'Ana',
      orderNumber: 'ORD-1',
      total: 'USD 10',
    });

    expect(emailProvider.sendTemplate).toHaveBeenCalledWith(
      'buyer@example.com',
      'ORDER_CONFIRMED',
      expect.objectContaining({ orderNumber: 'ORD-1' }),
    );
  });

  it('skips when customer opted out', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      customerEmail: 'buyer@example.com',
      user: { emailOptOut: true },
    });

    await service.notify('o1', 'ORDER_CONFIRMED', 'buyer@example.com', {
      customerName: 'Ana',
      orderNumber: 'ORD-1',
      total: 'USD 10',
    });

    expect(emailProvider.sendTemplate).not.toHaveBeenCalled();
  });
});
