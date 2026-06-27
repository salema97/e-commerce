import { Injectable } from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ServientregaFulfillmentService } from './servientrega/servientrega-fulfillment.service.js';
import { ServientregaTrackingSyncService } from './servientrega/servientrega-tracking-sync.service.js';
import { FulfillmentProviderFactory } from './fulfillment-provider.factory.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { LabelService } from './label.service.js';
import type { ShipmentLineInput } from './fulfillment-provider.interface.js';

export interface AdminShipmentListItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  carrier: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: ShipmentStatus;
  shippingCost: number;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class FulfillmentService {
  constructor(
    private readonly providerFactory: FulfillmentProviderFactory,
    private readonly labelService: LabelService,
    private readonly prisma: PrismaService,
    private readonly servientregaFulfillment: ServientregaFulfillmentService,
    private readonly servientregaTrackingSync: ServientregaTrackingSyncService,
  ) {}

  createShipment(orderId: string, dto: CreateShipmentDto) {
    return this.providerFactory.resolve().createShipment({
      orderId,
      carrier: dto.carrier,
      trackingNumber: dto.trackingNumber,
      trackingUrl: dto.trackingUrl,
      shippingCost: dto.shippingCost,
      items: dto.items,
    });
  }

  createServientregaShipment(orderId: string, items?: ShipmentLineInput[]) {
    return this.servientregaFulfillment.createShipmentFromOrder(orderId, items);
  }

  syncServientregaShipmentTracking(shipmentId: string) {
    return this.servientregaTrackingSync.syncShipment(shipmentId);
  }

  syncServientregaActiveTracking(limit?: number) {
    return this.servientregaTrackingSync.syncActiveShipments(limit);
  }

  markDelivered(shipmentId: string) {
    return this.providerFactory.resolve().markDelivered(shipmentId);
  }

  listShipments(orderId: string) {
    return this.providerFactory.resolve().listShipments(orderId);
  }

  async listAllShipments(params: {
    status?: ShipmentStatus;
    limit?: number;
    offset?: number;
  }): Promise<AdminShipmentListItem[]> {
    const shipments = await this.prisma.shipment.findMany({
      where: params.status ? { status: params.status } : undefined,
      include: {
        order: { select: { orderNumber: true, customerEmail: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit ?? 50,
      skip: params.offset ?? 0,
    });

    return shipments.map((shipment) => ({
      id: shipment.id,
      orderId: shipment.orderId,
      orderNumber: shipment.order.orderNumber,
      customerEmail: shipment.order.customerEmail,
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
      trackingUrl: shipment.trackingUrl,
      status: shipment.status,
      shippingCost: Number(shipment.shippingCost),
      shippedAt: shipment.shippedAt,
      deliveredAt: shipment.deliveredAt,
      createdAt: shipment.createdAt,
    }));
  }

  getLabelHtml(shipmentId: string) {
    return this.labelService.renderLabelHtml(shipmentId);
  }
}
