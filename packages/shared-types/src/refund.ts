import type { RefundStatus } from './enums.js';

export type RefundType = 'full' | 'partial';

export interface Refund {
  id: string;
  orderId: string;
  paymentId?: string | null;
  providerRefundId?: string | null;
  amount: number;
  reason: string;
  status: RefundStatus;
  type?: RefundType;
  requestedById?: string | null;
  approvedById?: string | null;
  createdAt: string;
  updatedAt: string;
  order?: unknown;
  payment?: unknown;
}

export interface CreateRefundDto {
  amount: number;
  type: RefundType;
  reason?: string;
}

export interface RefundResult {
  refundId: string;
  status: RefundStatus;
  amount: number;
  currency: string;
}
