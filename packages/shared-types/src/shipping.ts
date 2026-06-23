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

export interface ShippingQuoteDto {
  country?: string;
  province?: string;
  subtotal: number;
  freeShipping?: boolean;
}

export interface ShippingQuote {
  amount: number;
  zoneCode: string;
  zoneName: string;
  freeShippingApplied: boolean;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  status: ShipmentStatus;
  shippingCost: number;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentDto {
  carrier: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingCost?: number;
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
