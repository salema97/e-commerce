import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefundMethod, ReturnStatus } from '@prisma/client';
import { ReturnNotificationService } from './return-notification.service.js';

describe('ReturnNotificationService', () => {
  const prisma = {
    returnRequest: {
      findUnique: vi.fn(),
    },
  };
  const emailNotificationService = { notify: vi.fn().mockResolvedValue(undefined) };
  const whatsappNotificationService = { notify: vi.fn().mockResolvedValue(undefined) };
  const pushNotificationService = {
    notifyForOrder: vi.fn().mockResolvedValue(undefined),
  };

  let service: ReturnNotificationService;

  const order = {
    id: 'ord_1',
    orderNumber: 'ORD-100',
    customerEmail: 'client@example.com',
    customerPhone: '+593991234567',
    userId: 'user_1',
    customerName: 'Ana',
  };

  const returnRequest = {
    id: 'ret_1',
    orderId: 'ord_1',
    reason: 'Producto defectuoso',
    refundMethod: null,
    status: ReturnStatus.REQUESTED,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.returnRequest.findUnique.mockResolvedValue({ ...returnRequest, order });
    service = new ReturnNotificationService(
      prisma as never,
      emailNotificationService as never,
      whatsappNotificationService as never,
      pushNotificationService as never,
    );
  });

  it('sends RETURN_REQUESTED on new return', async () => {
    await service.onReturnRequested(returnRequest as never);

    expect(emailNotificationService.notify).toHaveBeenCalledWith(
      'ord_1',
      'RETURN_REQUESTED',
      'client@example.com',
      expect.objectContaining({ returnId: 'ret_1' }),
      expect.any(Object),
    );
    expect(whatsappNotificationService.notify).toHaveBeenCalled();
  });

  it('sends REFUND_CONFIRMED when resolved with original payment', async () => {
    await service.onReturnStatusChanged(
      { ...returnRequest, refundMethod: RefundMethod.ORIGINAL_PAYMENT } as never,
      ReturnStatus.APPROVED,
      ReturnStatus.RESOLVED,
      { refundAmount: 49.99 },
    );

    expect(emailNotificationService.notify).toHaveBeenCalledWith(
      'ord_1',
      'REFUND_CONFIRMED',
      'client@example.com',
      expect.objectContaining({ amount: 'USD 49.99' }),
      expect.any(Object),
    );
  });

  it('sends RETURN_STORE_CREDIT when resolved with store credit', async () => {
    await service.onReturnStatusChanged(
      { ...returnRequest, refundMethod: RefundMethod.STORE_CREDIT } as never,
      ReturnStatus.APPROVED,
      ReturnStatus.RESOLVED,
      { refundAmount: 25 },
    );

    expect(emailNotificationService.notify).toHaveBeenCalledWith(
      'ord_1',
      'RETURN_STORE_CREDIT',
      'client@example.com',
      expect.objectContaining({ amount: 'USD 25.00' }),
      expect.any(Object),
    );
  });

  it('sends RETURN_STATUS_CHANGED for other transitions', async () => {
    await service.onReturnStatusChanged(
      returnRequest as never,
      ReturnStatus.REQUESTED,
      ReturnStatus.APPROVED,
    );

    expect(emailNotificationService.notify).toHaveBeenCalledWith(
      'ord_1',
      'RETURN_STATUS_CHANGED',
      'client@example.com',
      expect.objectContaining({ toStatus: 'Aprobada' }),
      expect.any(Object),
    );
  });
});
