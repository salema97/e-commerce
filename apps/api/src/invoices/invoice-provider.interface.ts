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

export interface CreditNoteItem extends InvoiceItem {
  reason?: string;
}

export interface CreditNoteInput {
  returnRequestId: string;
  invoiceAccessKey: string;
  parentInvoiceAccessKey?: string;
  authorizationNumber?: string;
  codDocModificado: string;
  numDocModificado: string;
  fechaEmisionDocumentoModificado: string;
  reason: string;
  items: CreditNoteItem[];
  total: number;
}

export interface InvoiceProvider {
  issueInvoice(order: InvoiceOrder): Promise<InvoiceResult>;
  getInvoiceStatus(accessKey: string): Promise<InvoiceStatus>;
  issueCreditNote(returnRequest: CreditNoteInput): Promise<InvoiceResult>;
}
