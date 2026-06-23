import { OrderItemFulfillmentStatus, ShipmentStatus } from '@prisma/client';

export interface ShipmentLineInput {
  orderItemId: string;
  quantity: number;
}

export interface CreateShipmentInput {
  orderId: string;
  carrier: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingCost?: number;
  externalId?: string;
  items?: ShipmentLineInput[];
}

export interface ShipmentItemRecord {
  id: string;
  orderItemId: string;
  quantity: number;
}

export interface ShipmentRecord {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  externalId?: string | null;
  status: ShipmentStatus;
  shippingCost: number;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  items?: ShipmentItemRecord[];
}

export interface WmsInventoryRecord {
  sku: string;
  quantity: number;
  warehouseCode?: string;
}

export interface WmsTrackingEvent {
  externalShipmentId: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status?: ShipmentStatus;
}

export interface WmsSyncResult {
  updated: number;
  skipped: number;
  errors: string[];
}

export abstract class FulfillmentProvider {
  abstract createShipment(input: CreateShipmentInput): Promise<ShipmentRecord>;

  abstract markDelivered(shipmentId: string): Promise<ShipmentRecord>;

  abstract listShipments(orderId: string): Promise<ShipmentRecord[]>;

  abstract syncInventory(records: WmsInventoryRecord[]): Promise<WmsSyncResult>;

  abstract importTrackingEvents(events: WmsTrackingEvent[]): Promise<number>;
}
