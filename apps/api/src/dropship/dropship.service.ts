import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { FulfillmentSource } from '@prisma/client';
import type { DomainEvent } from '@repo/shared-types';
import { PrismaService } from '../prisma/prisma.service.js';
import { FulfillmentService } from '../fulfillment/fulfillment.service.js';
import { EventBus } from '../event-bus/event-bus.interface.js';

@Injectable()
export class DropshipService {
  private readonly logger = new Logger(DropshipService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fulfillmentService: FulfillmentService,
  ) {}

  async splitOrderBySupplier(orderId: string): Promise<Array<{ supplierId: string; shipmentId: string }>> {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId, fulfillmentSource: FulfillmentSource.DROPSHIP, supplierId: { not: null } },
      include: { supplier: true },
    });
    if (!items.length) return [];

    const groups = new Map<string, typeof items>();
    for (const item of items) {
      if (!item.supplierId) continue;
      const group = groups.get(item.supplierId) ?? [];
      group.push(item);
      groups.set(item.supplierId, group);
    }

    const results: Array<{ supplierId: string; shipmentId: string }> = [];
    for (const [supplierId, groupItems] of groups.entries()) {
      const supplier = groupItems[0]?.supplier;
      const shipment = await this.fulfillmentService.createShipment(orderId, {
        carrier: 'DROPSHIP',
        trackingNumber: `DS-${supplierId.slice(0, 8)}-${Date.now()}`,
        trackingUrl: undefined,
        shippingCost: 0,
        items: groupItems.map((item) => ({
          orderItemId: item.id,
          quantity: item.quantity,
        })),
      });
      results.push({ supplierId, shipmentId: shipment.id });

      if (supplier?.fulfillmentContactEmail) {
        this.logger.log(
          { orderId, supplierId, email: supplier.fulfillmentContactEmail },
          'Dropship PO notification queued (email integration deferred)',
        );
      }
    }

    return results;
  }
}

@Injectable()
export class OrderPaidDropshipConsumer implements OnModuleInit {
  constructor(
    @Inject(EventBus) private readonly eventBus: EventBus,
    private readonly dropshipService: DropshipService,
  ) {}

  onModuleInit(): void {
    this.eventBus.registerHandler((event) => this.handle(event));
  }

  private async handle(event: DomainEvent): Promise<void> {
    if (event.name !== 'order.paid' || !event.payload.orderId) {
      return;
    }
    await this.dropshipService.splitOrderBySupplier(String(event.payload.orderId));
  }
}
