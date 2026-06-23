import { describe, expect, it, vi } from 'vitest';
import { OrderConfirmationService } from './order-confirmation.service.js';

describe('OrderConfirmationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    idempotency.claim.mockResolvedValue(true);
  });

  const idempotency = {
    claim: vi.fn().mockResolvedValue(true),
    release: vi.fn().mockResolvedValue(undefined),
  };

  const notificationService = { notify: vi.fn().mockResolvedValue(undefined) };
  const emailNotificationService = { notify: vi.fn().mockResolvedValue(undefined) };
  const pushNotificationService = { notifyForOrder: vi.fn().mockResolvedValue(undefined) };
  const marketingAutomation = { trackPurchaseEvent: vi.fn().mockResolvedValue(undefined) };
  const orderSummaryPdf = {
    buildEmailAttachment: vi.fn().mockResolvedValue({
      filename: 'pedido.pdf',
      content: Buffer.from('pdf'),
      contentType: 'application/pdf',
    }),
  };

  const prisma = {
    order: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'o1',
        orderNumber: 'ORD-1',
        total: 45.98,
        customerPhone: '+593991234567',
        customerEmail: 'buyer@example.com',
        userId: 'u1',
        user: { whatsappOptOut: false, emailOptOut: false },
      }),
    },
  };

  const service = new OrderConfirmationService(
    prisma as never,
    notificationService as never,
    emailNotificationService as never,
    pushNotificationService as never,
    marketingAutomation as never,
    orderSummaryPdf as never,
    idempotency as never,
  );

  it('sends all paid-order notifications once', async () => {
    await service.sendPaidOrderNotifications('o1');

    expect(idempotency.claim).toHaveBeenCalledWith('order-paid:confirm:o1', 86_400);
    expect(notificationService.notify).toHaveBeenCalledWith(
      'o1',
      'ORDER_CONFIRMED',
      '+593991234567',
      expect.objectContaining({ orderNumber: 'ORD-1' }),
    );
    expect(emailNotificationService.notify).toHaveBeenCalled();
    expect(pushNotificationService.notifyForOrder).toHaveBeenCalled();
    expect(marketingAutomation.trackPurchaseEvent).toHaveBeenCalledWith('o1');
  });

  it('skips duplicate notifications when idempotency key exists', async () => {
    idempotency.claim.mockResolvedValueOnce(false);

    await service.sendPaidOrderNotifications('o1');

    expect(notificationService.notify).not.toHaveBeenCalled();
  });
});
