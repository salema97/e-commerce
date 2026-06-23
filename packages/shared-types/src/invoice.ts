import type { InvoiceStatus } from './enums.js';

export interface Invoice {
  id: string;
  orderId: string;
  documentType: string;
  accessKey: string;
  authorizationNumber?: string | null;
  status: InvoiceStatus;
  sriResponse?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  order?: unknown;
}

export interface IssueInvoiceDto {
  orderId: string;
  documentType?: string;
}

export interface InvoiceResponseDto {
  id: string;
  orderId: string;
  documentType: string;
  accessKey: string;
  authorizationNumber?: string | null;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceSequence {
  id: string;
  documentType: string;
  establishmentCode: string;
  emissionPointCode: string;
  lastNumber: number;
  startNumber: number;
  endNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptResponse {
  id: string;
  orderId: string;
  number: string;
  url: string | null;
  emailDelivered: boolean;
  createdAt: string;
}
