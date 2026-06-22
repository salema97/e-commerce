import type { Order } from './order.js';
import type { ReturnStatus, RefundMethod, ReturnItemCondition, CreditNoteStatus } from './return-enums.js';

export interface ReturnItem {
  id: string;
  returnRequestId: string;
  productId: string;
  productVariantId?: string | null;
  quantity: number;
  condition?: ReturnItemCondition | null;
  refundValue?: number | null;
  createdAt: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId?: string | null;
  status: ReturnStatus;
  reason: string;
  refundMethod?: RefundMethod | null;
  returnWindowDays: number;
  inspectedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  approvedById?: string | null;
  rejectedById?: string | null;
  creditNoteId?: string | null;
  exchangeOrderId?: string | null;
  createdAt: string;
  updatedAt: string;
  items: ReturnItem[];
  order?: { orderNumber: string; customerEmail: string };
  creditNote?: CreditNoteResponse | null;
  exchangeOrder?: Order | null;
}

export interface CreateReturnRequestItemDto {
  productId: string;
  productVariantId?: string;
  quantity: number;
  condition?: ReturnItemCondition;
  refundValue?: number;
}

export interface CreateReturnRequestDto {
  items: CreateReturnRequestItemDto[];
  reason: string;
  refundMethod?: RefundMethod;
}

export interface CreateGuestReturnRequestDto {
  orderId: string;
  email: string;
  items: CreateReturnRequestItemDto[];
  reason: string;
  refundMethod?: RefundMethod;
}

export interface UpdateReturnStatusDto {
  status: ReturnStatus;
  refundMethod?: RefundMethod;
  notes?: string;
  creditNoteId?: string;
}

export interface ResolveReturnDto {
  refundMethod: RefundMethod;
  notes?: string;
  exchangeProductIds?: string[];
}

export interface CreditNoteResponse {
  id: string;
  accessKey: string;
  parentInvoiceAccessKey?: string | null;
  authorizationNumber?: string | null;
  status: CreditNoteStatus;
  xmlContent?: string | null;
  totalAmount: number;
  returnRequestId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoreCreditBalance {
  userId: string;
  balance: number;
  currency: string;
  expiresAt: string | null;
}
