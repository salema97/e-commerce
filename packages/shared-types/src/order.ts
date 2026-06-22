import type { OrderStatus } from './enums.js';
import type { OrderAddress } from './address.js';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string | null;
  name: string;
  sku: string;
  price: number;
  quantity: number;
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
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  shippingAddress?: OrderAddress | null;
  billingAddress?: OrderAddress | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: unknown;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
  payments?: unknown[];
  refunds?: unknown[];
  invoice?: unknown;
}

export interface CreateOrderDto {
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;
  notes?: string;
  cartId?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  notes?: string;
}
