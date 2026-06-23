import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { CampaignEmailService } from './campaign-email.service.js';
import { EmailProvider } from './email-provider.interface.js';

describe('CampaignEmailService', () => {
  let service: CampaignEmailService;
  let emailProvider: { sendTemplate: ReturnType<typeof vi.fn> };
  let prisma: {
    user: { findUnique: ReturnType<typeof vi.fn> };
  };
  let idempotency: { claim: ReturnType<typeof vi.fn>; release: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    emailProvider = { sendTemplate: vi.fn() };
    prisma = { user: { findUnique: vi.fn() } };
    idempotency = { claim: vi.fn().mockResolvedValue(true), release: vi.fn().mockResolvedValue(undefined) };
    const config = {
      get: (key: string) => (key === 'EMAIL_NOTIFICATIONS_ENABLED' ? 'true' : undefined),
    } as unknown as ConfigService;

    service = new CampaignEmailService(
      emailProvider as unknown as EmailProvider,
      prisma as never,
      config,
      idempotency as never,
    );
  });

  it('sends back-in-stock email', async () => {
    const sent = await service.send(
      'buyer@example.com',
      'BACK_IN_STOCK',
      {
        customerName: 'Ana',
        productName: 'Camiseta',
        productUrl: 'http://localhost:3000/product/camiseta',
      },
      'alert-1',
    );

    expect(sent).toBe(true);
    expect(emailProvider.sendTemplate).toHaveBeenCalledWith(
      'buyer@example.com',
      'BACK_IN_STOCK',
      expect.objectContaining({ productName: 'Camiseta' }),
    );
  });

  it('skips marketing email when user opted out', async () => {
    prisma.user.findUnique.mockResolvedValue({ marketingEmailOptOut: true });

    const sent = await service.send(
      'buyer@example.com',
      'ABANDONED_CART',
      {
        customerName: 'Ana',
        itemCount: '2',
        cartUrl: 'http://localhost:3000/cart',
      },
      'cart-1',
      { userId: 'u1', respectMarketingOptOut: true },
    );

    expect(sent).toBe(false);
    expect(emailProvider.sendTemplate).not.toHaveBeenCalled();
    expect(idempotency.claim).not.toHaveBeenCalled();
  });
});
