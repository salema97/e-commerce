import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, ShipmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateShipmentInput,
  FulfillmentProvider,
  ShipmentRecord,
} from './fulfillment-provider.interface.js';

@Injectable()
export class ManualFulfillmentProvider extends FulfillmentProvider {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createShipment(input: CreateShipmentInput): Promise<ShipmentRecord> {
    const order = await this.prisma.order.findUnique({ where: { id: input.orderId } });
    if (!order) {
      throw new NotFoundException(`Order ${input.orderId} not found`);
    }

    const shipment = await this.prisma.shipment.create({
      data: {
        orderId: input.orderId,
        carrier: input.carrier,
        trackingNumber: input.trackingNumber,
        trackingUrl: input.trackingUrl,
        shippingCost: new Prisma.Decimal(input.shippingCost ?? Number(order.shippingAmount)),
        status: ShipmentStatus.IN_TRANSIT,
        shippedAt: new Date(),
      },
    });

    if (order.status !== OrderStatus.SHIPPED && order.status !== OrderStatus.DELIVERED) {
      await this.prisma.order.update({
        where: { id: input.orderId },
        data: {
          status: OrderStatus.SHIPPED,
          statusHistory: {
            create: { status: OrderStatus.SHIPPED, notes: 'Shipment created' },
          },
        },
      });
    }

    return this.toRecord(shipment);
  }

  async markDelivered(shipmentId: string): Promise<ShipmentRecord> {
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) {
      throw new NotFoundException(`Shipment ${shipmentId} not found`);
    }

    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: ShipmentStatus.DELIVERED,
        deliveredAt: new Date(),
      },
    });

    await this.prisma.order.update({
      where: { id: shipment.orderId },
      data: {
        status: OrderStatus.DELIVERED,
        statusHistory: {
          create: { status: OrderStatus.DELIVERED, notes: 'Shipment delivered' },
        },
      },
    });

    return this.toRecord(updated);
  }

  async listShipments(orderId: string): Promise<ShipmentRecord[]> {
    const shipments = await this.prisma.shipment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
    return shipments.map((shipment) => this.toRecord(shipment));
  }

  private toRecord(shipment: {
    id: string;
    orderId: string;
    carrier: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
    status: ShipmentStatus;
    shippingCost: Prisma.Decimal;
    shippedAt: Date | null;
    deliveredAt: Date | null;
  }): ShipmentRecord {
    return {
      id: shipment.id,
      orderId: shipment.orderId,
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
      trackingUrl: shipment.trackingUrl,
      status: shipment.status,
      shippingCost: Number(shipment.shippingCost),
      shippedAt: shipment.shippedAt,
      deliveredAt: shipment.deliveredAt,
    };
  }
}
