import { ShipmentStatus } from '@prisma/client';

export interface CreateShipmentInput {
  orderId: string;
  carrier: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingCost?: number;
}

export interface ShipmentRecord {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  status: ShipmentStatus;
  shippingCost: number;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
}

export abstract class FulfillmentProvider {
  abstract createShipment(input: CreateShipmentInput): Promise<ShipmentRecord>;

  abstract markDelivered(shipmentId: string): Promise<ShipmentRecord>;

  abstract listShipments(orderId: string): Promise<ShipmentRecord[]>;
}
