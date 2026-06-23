import { Injectable } from '@nestjs/common';
import { OrderItemFulfillmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  WmsInventoryRecord,
  WmsSyncResult,
  WmsTrackingEvent,
} from './fulfillment-provider.interface.js';
import { FulfillmentProviderFactory } from './fulfillment-provider.factory.js';
import { WMS_PROVIDER_REGISTRY } from './wms-provider.registry.js';

@Injectable()
export class WmsIntegrationService {
  constructor(
    private readonly providerFactory: FulfillmentProviderFactory,
    private readonly prisma: PrismaService,
  ) {}

  listProviders() {
    return WMS_PROVIDER_REGISTRY;
  }

  async syncInventory(records: WmsInventoryRecord[]): Promise<WmsSyncResult> {
    return this.providerFactory.resolve().syncInventory(records);
  }

  async importTracking(events: WmsTrackingEvent[]): Promise<number> {
    return this.providerFactory.resolve().importTrackingEvents(events);
  }

  async listBackorders(limit = 50) {
    return this.prisma.orderItem.findMany({
      where: {
        OR: [
          { fulfillmentStatus: OrderItemFulfillmentStatus.BACKORDERED },
          { quantityBackordered: { gt: 0 } },
        ],
      },
      include: {
        order: { select: { id: true, orderNumber: true, status: true, customerEmail: true } },
        product: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
