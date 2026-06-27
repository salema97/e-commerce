import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ManualFulfillmentProvider } from '../manual-fulfillment.provider.js';
import { ServientregaTrackingSoapClient } from '../../shipping/servientrega/servientrega-tracking-soap.client.js';

@Injectable()
export class ServientregaTrackingSyncService {
  private readonly logger = new Logger(ServientregaTrackingSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingClient: ServientregaTrackingSoapClient,
    private readonly manualFulfillment: ManualFulfillmentProvider,
  ) {}

  async syncShipment(shipmentId: string) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) {
      throw new NotFoundException(`Shipment ${shipmentId} not found`);
    }
    if (!shipment.trackingNumber) {
      throw new BadRequestException('Shipment has no tracking number to sync');
    }
    if (!shipment.carrier.toLowerCase().includes('servientrega')) {
      throw new BadRequestException('Shipment carrier is not Servientrega');
    }

    const snapshot = await this.trackingClient.consultGuide(shipment.trackingNumber);

    if (snapshot.isDelivered && shipment.status !== ShipmentStatus.DELIVERED) {
      const delivered = await this.manualFulfillment.markDelivered(shipment.id);
      this.logger.log({ shipmentId, guide: snapshot.guideNumber }, 'Servientrega shipment delivered');
      return { shipment: delivered, snapshot };
    }

    if (shipment.status === ShipmentStatus.PENDING || shipment.status === ShipmentStatus.LABEL_CREATED) {
      const updated = await this.prisma.shipment.update({
        where: { id: shipment.id },
        data: { status: ShipmentStatus.IN_TRANSIT },
        include: { items: true },
      });
      return {
        shipment: {
          id: updated.id,
          orderId: updated.orderId,
          carrier: updated.carrier,
          trackingNumber: updated.trackingNumber,
          trackingUrl: updated.trackingUrl,
          labelUrl: updated.labelUrl,
          externalId: updated.externalId,
          status: updated.status,
          shippingCost: Number(updated.shippingCost),
          shippedAt: updated.shippedAt,
          deliveredAt: updated.deliveredAt,
          items: updated.items.map((item: { id: string; orderItemId: string; quantity: number }) => ({
            id: item.id,
            orderItemId: item.orderItemId,
            quantity: item.quantity,
          })),
        },
        snapshot,
      };
    }

    return { shipment, snapshot };
  }

  async syncActiveShipments(limit = 25) {
    const shipments = await this.prisma.shipment.findMany({
      where: {
        carrier: { contains: 'servientrega', mode: 'insensitive' },
        status: { in: [ShipmentStatus.PENDING, ShipmentStatus.LABEL_CREATED, ShipmentStatus.IN_TRANSIT] },
        trackingNumber: { not: null },
      },
      orderBy: { updatedAt: 'asc' },
      take: limit,
    });

    const results = [];
    for (const shipment of shipments) {
      try {
        results.push({
          shipmentId: shipment.id,
          ok: true,
          result: await this.syncShipment(shipment.id),
        });
      } catch (error) {
        results.push({
          shipmentId: shipment.id,
          ok: false,
          error: error instanceof Error ? error.message : 'sync failed',
        });
      }
    }

    return {
      processed: results.length,
      succeeded: results.filter((entry) => entry.ok).length,
      failed: results.filter((entry) => !entry.ok).length,
      results,
    };
  }
}
