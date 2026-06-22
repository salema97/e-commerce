import type { RefundStatus } from './enums.js';

export interface Refund {
  id: string;
  orderId: string;
  paymentId?: string | null;
  amount: number;
  reason: string;
  status: RefundStatus;
  createdAt: string;
  updatedAt: string;
  order?: unknown;
  payment?: unknown;
}

export interface CreateRefundDto {
  orderId: string;
  paymentId?: string;
  amount: number;
  reason: string;
}

export interface RefundResult {
  refundId: string;
  status: RefundStatus;
  amount: number;
  currency: string;
}
