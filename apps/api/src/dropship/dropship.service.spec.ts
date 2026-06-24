import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DropshipService } from './dropship.service.js';
import { FulfillmentSource } from '@prisma/client';

describe('DropshipService', () => {
  let service: DropshipService;
  let prisma: { orderItem: { findMany: ReturnType<typeof vi.fn> } };
  let fulfillmentService: { createShipment: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = { orderItem: { findMany: vi.fn() } };
    fulfillmentService = { createShipment: vi.fn().mockResolvedValue({ id: 'ship1' }) };
    service = new DropshipService(prisma as never, fulfillmentService as never);
  });

  it('splits dropship items into supplier shipments', async () => {
    prisma.orderItem.findMany.mockResolvedValue([
      {
        id: 'oi1',
        supplierId: 'sup1',
        quantity: 2,
        fulfillmentSource: FulfillmentSource.DROPSHIP,
        supplier: { fulfillmentContactEmail: 'dropship@supplier.com' },
      },
    ]);

    const result = await service.splitOrderBySupplier('o1');

    expect(result).toHaveLength(1);
    expect(fulfillmentService.createShipment).toHaveBeenCalledWith(
      'o1',
      expect.objectContaining({ carrier: 'DROPSHIP' }),
    );
  });
});
