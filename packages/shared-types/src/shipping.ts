import type { OrderStatus } from './enums.js';

export type ShipmentStatus =
  | 'PENDING'
  | 'LABEL_CREATED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED';

export type ShippingZoneType = 'DOMESTIC' | 'INTERNATIONAL' | 'EXCLUDED';

export type TaxCategory = 'STANDARD' | 'REDUCED' | 'ZERO' | 'EXEMPT';

export type OrderItemFulfillmentStatus =
  | 'PENDING'
  | 'BACKORDERED'
  | 'ALLOCATED'
  | 'PARTIALLY_SHIPPED'
  | 'SHIPPED'
  | 'CANCELLED';

export interface ShippingZone {
  id: string;
  name: string;
  code: string;
  zoneType: ShippingZoneType;
  provinces: string[];
  baseRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CarrierRateOption {
  provider: string;
  carrier: string;
  service: string;
  amount: number;
  currency: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export interface ShippingQuoteDto {
  country?: string;
  province?: string;
  city?: string;
  street?: string;
  zipCode?: string;
  subtotal: number;
  freeShipping?: boolean;
  weightKg?: number;
}

export interface ShippingQuote {
  amount: number;
  zoneCode: string;
  zoneName: string;
  freeShippingApplied: boolean;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  provider: string;
  options?: CarrierRateOption[];
}

export interface ShipmentItem {
  id: string;
  orderItemId: string;
  quantity: number;
}

export interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  externalId?: string | null;
  status: ShipmentStatus;
  shippingCost: number;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: ShipmentItem[];
}

export interface ShipmentLineDto {
  orderItemId: string;
  quantity: number;
}

export interface CreateShipmentDto {
  carrier: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingCost?: number;
  items?: ShipmentLineDto[];
}

export interface OrderTracking {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  shipments: Shipment[];
}

export interface UpdateReturnShippingDto {
  returnCarrier?: string;
  returnTrackingNumber?: string;
  returnTrackingUrl?: string;
}

export interface WmsProviderProfile {
  id: string;
  name: string;
  regions: string[];
  skuVelocity: 'low' | 'medium' | 'high';
  notes: string;
}

export interface WmsInventoryRecord {
  sku: string;
  quantity: number;
  warehouseCode?: string;
}

export interface WmsSyncResult {
  updated: number;
  skipped: number;
  errors: string[];
}

export interface WmsTrackingEvent {
  externalShipmentId: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status?: ShipmentStatus;
}
