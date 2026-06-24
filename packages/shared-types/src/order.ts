import type { OrderStatus, PaymentChannel } from './enums.js';
import type { OrderAddress } from './address.js';
import type { Payment } from './payment.js';
import type { Refund } from './refund.js';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string | null;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  taxRate?: number;
  discountAmount?: number;
  createdAt: string;
  product?: unknown;
  variant?: unknown;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  notes?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerEmail: string;
  customerPhone?: string | null;
  customerName?: string | null;
  customerIdentification?: string | null;
  customerAddress?: string | null;
  status: OrderStatus;
  channel?: PaymentChannel | null;
  couponCode?: string | null;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  reservationExpiresAt?: string | null;
  shippingAddress?: OrderAddress | null;
  billingAddress?: OrderAddress | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: unknown;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
  payments?: Payment[];
  refunds?: Refund[];
  invoice?: unknown;
  receipt?: unknown;
}

export interface CreateOrderItemDto {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
}

export interface CreateOrderDto {
  items: CreateOrderItemDto[];
  channel?: PaymentChannel;
  couponCode?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  customerIdentification?: string;
  customerAddress?: string;
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;
  notes?: string;
  cartId?: string;
  referralCode?: string;
  loyaltyPointsToRedeem?: number;
  companyId?: string;
  purchaseOrderNumber?: string;
  netPaymentTerms?: 'NET_0' | 'NET_15' | 'NET_30' | 'NET_60';
}

export interface CreatedOrderResult {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  channel: PaymentChannel;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  couponCode?: string;
  reservationExpiresAt: string;
  items: Array<{
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    taxRate?: number;
    discountAmount?: number;
  }>;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  notes?: string;
}
