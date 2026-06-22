import type { InvoiceStatus } from './enums.js';

export interface Invoice {
  id: string;
  orderId: string;
  documentType: string;
  accessKey: string;
  authorizationNumber?: string | null;
  status: InvoiceStatus;
  xmlContent?: string | null;
  pdfUrl?: string | null;
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
  xmlContent?: string | null;
  pdfUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceSequence {
  id: string;
  documentType: string;
  establishmentCode: string;
  emissionPointCode: string;
  currentNumber: number;
  startNumber: number;
  endNumber: number;
  createdAt: string;
  updatedAt: string;
}
