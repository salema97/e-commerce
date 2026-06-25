export type QuoteStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONVERTED';

export interface QuoteLine {
  id: string;
  quoteId: string;
  productId: string;
  variantId?: string | null;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  companyId?: string | null;
  requestedByUserId?: string | null;
  status: QuoteStatus;
  expiresAt: string;
  purchaseOrderNumber?: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  convertedOrderId?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: QuoteLine[];
  company?: { id: string; name: string };
}

export interface CreateQuoteLineDto {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice?: number;
}

export interface CreateQuoteDto {
  companyId?: string;
  purchaseOrderNumber?: string;
  expiresAt?: string;
  notes?: string;
  items: CreateQuoteLineDto[];
}

export interface UpdateQuoteStatusDto {
  status: QuoteStatus;
}

export interface ConvertQuoteResult {
  quoteId: string;
  orderId: string;
  orderNumber: string;
}
