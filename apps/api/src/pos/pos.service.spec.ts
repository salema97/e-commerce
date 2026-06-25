import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PosService } from './pos.service.js';
import { OrderChannel, OrderStatus, PaymentStatus } from '@prisma/client';

describe('PosService', () => {
  let service: PosService;
  let prisma: {
    posRegister: { findUnique: ReturnType<typeof vi.fn> };
    product: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    order: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    orderStatusHistory: { create: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
    payment: { create: ReturnType<typeof vi.fn> };
  };
  let ordersService: { createOrder: ReturnType<typeof vi.fn> };
  let reservationService: { confirm: ReturnType<typeof vi.fn> };
  let receiptService: { generateReceipt: ReturnType<typeof vi.fn> };
  let invoicesService: { enqueueInvoiceForOrder: ReturnType<typeof vi.fn> };
  let eventBus: { publish: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = {
      posRegister: { findUnique: vi.fn() },
      product: { findUnique: vi.fn(), update: vi.fn() },
      order: { findUnique: vi.fn(), update: vi.fn() },
      orderStatusHistory: { create: vi.fn() },
      $transaction: vi.fn(async (cb) =>
        cb({
          payment: { create: vi.fn() },
          order: { update: vi.fn() },
          orderStatusHistory: { create: vi.fn() },
        }),
      ),
      payment: { create: vi.fn() },
    };
    ordersService = { createOrder: vi.fn() };
    reservationService = { confirm: vi.fn() };
    receiptService = { generateReceipt: vi.fn().mockResolvedValue({ id: 'r1' }) };
    invoicesService = { enqueueInvoiceForOrder: vi.fn().mockResolvedValue(undefined) };
    eventBus = { publish: vi.fn() };

    service = new PosService(
      prisma as never,
      ordersService as never,
      reservationService as never,
      invoicesService as never,
      receiptService as never,
      { createPaymentIntent: vi.fn() } as never,
      eventBus as never,
    );
  });

  it('creates POS order with catalog prices and completes cash payment', async () => {
    prisma.posRegister.findUnique.mockResolvedValue({
      id: 'reg1',
      isActive: true,
      location: { isActive: true, supportsPos: true },
    });
    prisma.product.findUnique.mockResolvedValue({
      id: 'p1',
      price: 25,
      sku: 'SKU1',
      variants: [],
    });
    ordersService.createOrder.mockResolvedValue({
      id: 'o1',
      orderNumber: 'ORD-1',
      total: 50,
      status: OrderStatus.PAYMENT_PENDING,
    });
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      channel: OrderChannel.POS,
      status: OrderStatus.PAYMENT_PENDING,
      total: 50,
    });

    const created = await service.createPosOrder({
      posRegisterId: 'reg1',
      customerEmail: 'buyer@example.com',
      paymentProvider: 'CASH',
      items: [{ productId: 'p1', quantity: 2 }],
    });

    expect(created.paymentStatus).toBe(PaymentStatus.COMPLETED);
    expect(ordersService.createOrder).toHaveBeenCalled();
    expect(reservationService.confirm).toHaveBeenCalledWith('o1');
    expect(eventBus.publish).toHaveBeenCalledWith({ name: 'order.paid', payload: { orderId: 'o1' } });
  });
});
