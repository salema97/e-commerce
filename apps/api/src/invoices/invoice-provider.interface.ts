import { InvoiceStatus } from './invoice-status.enum.js';

export interface InvoiceItem {
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

export interface InvoiceOrder {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerIdentification?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
}

export interface InvoiceResult {
  accessKey: string;
  authorizationNumber?: string;
  status: InvoiceStatus;
  xmlContent?: string;
  sriResponse?: unknown;
}

export interface CreditNoteInput {
  invoiceAccessKey: string;
  reason: string;
  items: InvoiceItem[];
  total: number;
}

export interface InvoiceProvider {
  issueInvoice(order: InvoiceOrder): Promise<InvoiceResult>;
  getInvoiceStatus(accessKey: string): Promise<InvoiceStatus>;
  issueCreditNote(returnRequest: CreditNoteInput): Promise<InvoiceResult>;
}
