import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderItemFulfillmentStatus,
  OrderStatus,
  Prisma,
  ShipmentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateShipmentInput,
  FulfillmentProvider,
  ShipmentRecord,
  WmsInventoryRecord,
  WmsSyncResult,
  WmsTrackingEvent,
} from './fulfillment-provider.interface.js';
import { LabelService } from './label.service.js';

@Injectable()
export class ManualFulfillmentProvider extends FulfillmentProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly labelService: LabelService,
  ) {
    super();
  }

  async createShipment(input: CreateShipmentInput): Promise<ShipmentRecord> {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException(`Order ${input.orderId} not found`);
    }

    const lineItems = input.items?.length
      ? input.items
      : order.items
          .filter((item) => item.quantityShipped < item.quantity)
          .map((item) => ({
            orderItemId: item.id,
            quantity: item.quantity - item.quantityShipped - item.quantityBackordered,
          }))
          .filter((item) => item.quantity > 0);

    if (!lineItems.length) {
      throw new BadRequestException('No shippable items remain for this order');
    }

    const shipment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({
        data: {
          orderId: input.orderId,
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
          trackingUrl: input.trackingUrl,
          externalId: input.externalId,
          shippingCost: new Prisma.Decimal(input.shippingCost ?? Number(order.shippingAmount)),
          status: ShipmentStatus.IN_TRANSIT,
          shippedAt: new Date(),
          items: {
            create: lineItems.map((line) => ({
              orderItemId: line.orderItemId,
              quantity: line.quantity,
            })),
          },
        },
        include: { items: true },
      });

      for (const line of lineItems) {
        const orderItem = order.items.find((item) => item.id === line.orderItemId);
        if (!orderItem) {
          throw new BadRequestException(`Order item ${line.orderItemId} not found`);
        }
        const remaining =
          orderItem.quantity - orderItem.quantityShipped - orderItem.quantityBackordered;
        if (line.quantity > remaining) {
          throw new BadRequestException(
            `Cannot ship ${line.quantity} units for item ${line.orderItemId}`,
          );
        }

        const quantityShipped = orderItem.quantityShipped + line.quantity;
        const fulfillmentStatus =
          quantityShipped >= orderItem.quantity
            ? OrderItemFulfillmentStatus.SHIPPED
            : OrderItemFulfillmentStatus.PARTIALLY_SHIPPED;

        await tx.orderItem.update({
          where: { id: line.orderItemId },
          data: { quantityShipped, fulfillmentStatus },
        });
      }

      const refreshedItems = await tx.orderItem.findMany({ where: { orderId: order.id } });
      const allShipped = refreshedItems.every(
        (item) =>
          item.fulfillmentStatus === OrderItemFulfillmentStatus.SHIPPED ||
          item.quantityShipped + item.quantityBackordered >= item.quantity,
      );
      const anyShipped = refreshedItems.some((item) => item.quantityShipped > 0);

      if (allShipped && anyShipped) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.SHIPPED,
            statusHistory: { create: { status: OrderStatus.SHIPPED, notes: 'All items shipped' } },
          },
        });
      } else if (anyShipped) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PARTIALLY_SHIPPED,
            statusHistory: {
              create: {
                status: OrderStatus.PARTIALLY_SHIPPED,
                notes: 'Partial shipment created',
              },
            },
          },
        });
      }

      return created;
    });

    const labelUrl = await this.labelService.buildLabelUrl(shipment.id);
    const withLabel = await this.prisma.shipment.update({
      where: { id: shipment.id },
      data: { labelUrl },
      include: { items: true },
    });

    return this.toRecord(withLabel);
  }

  async markDelivered(shipmentId: string): Promise<ShipmentRecord> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { items: true, order: { include: { items: true } } },
    });
    if (!shipment) {
      throw new NotFoundException(`Shipment ${shipmentId} not found`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const record = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          status: ShipmentStatus.DELIVERED,
          deliveredAt: new Date(),
        },
        include: { items: true },
      });

      const orderItems = await tx.orderItem.findMany({ where: { orderId: shipment.orderId } });
      const allDelivered = orderItems.every(
        (item) =>
          item.fulfillmentStatus === OrderItemFulfillmentStatus.SHIPPED ||
          item.quantityShipped + item.quantityBackordered >= item.quantity,
      );

      if (allDelivered) {
        await tx.order.update({
          where: { id: shipment.orderId },
          data: {
            status: OrderStatus.DELIVERED,
            statusHistory: {
              create: { status: OrderStatus.DELIVERED, notes: 'Shipment delivered' },
            },
          },
        });
      }

      return record;
    });

    return this.toRecord(updated);
  }

  async listShipments(orderId: string): Promise<ShipmentRecord[]> {
    const shipments = await this.prisma.shipment.findMany({
      where: { orderId },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });
    return shipments.map((shipment) => this.toRecord(shipment));
  }

  async syncInventory(records: WmsInventoryRecord[]): Promise<WmsSyncResult> {
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const record of records) {
      try {
        const product = await this.prisma.product.findFirst({
          where: { sku: record.sku },
          include: { inventory: true },
        });
        if (!product || !product.inventory[0]) {
          skipped += 1;
          continue;
        }
        await this.prisma.inventory.update({
          where: { id: product.inventory[0].id },
          data: { quantity: record.quantity },
        });
        updated += 1;
      } catch (error) {
        errors.push(`${record.sku}: ${error instanceof Error ? error.message : 'sync failed'}`);
      }
    }

    return { updated, skipped, errors };
  }

  async importTrackingEvents(events: WmsTrackingEvent[]): Promise<number> {
    let imported = 0;
    for (const event of events) {
      const shipment = await this.prisma.shipment.findFirst({
        where: {
          OR: [{ externalId: event.externalShipmentId }, { id: event.externalShipmentId }],
        },
      });
      if (!shipment) continue;

      await this.prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          trackingNumber: event.trackingNumber ?? shipment.trackingNumber,
          trackingUrl: event.trackingUrl ?? shipment.trackingUrl,
          status: event.status ?? shipment.status,
        },
      });
      imported += 1;
    }
    return imported;
  }

  private toRecord(shipment: {
    id: string;
    orderId: string;
    carrier: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
    labelUrl?: string | null;
    externalId?: string | null;
    status: ShipmentStatus;
    shippingCost: Prisma.Decimal;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    items?: Array<{ id: string; orderItemId: string; quantity: number }>;
  }): ShipmentRecord {
    return {
      id: shipment.id,
      orderId: shipment.orderId,
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
      trackingUrl: shipment.trackingUrl,
      labelUrl: shipment.labelUrl ?? null,
      externalId: shipment.externalId ?? null,
      status: shipment.status,
      shippingCost: Number(shipment.shippingCost),
      shippedAt: shipment.shippedAt,
      deliveredAt: shipment.deliveredAt,
      items: shipment.items?.map((item) => ({
        id: item.id,
        orderItemId: item.orderItemId,
        quantity: item.quantity,
      })),
    };
  }
}
