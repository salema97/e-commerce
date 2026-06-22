import { InvoiceStatus } from '../invoice-status.enum.js';

export class InvoiceResponseDto {
  id!: string;
  orderId!: string;
  documentType!: string;
  accessKey!: string;
  authorizationNumber?: string | null;
  status!: InvoiceStatus;
  xmlContent?: string | null;
  pdfUrl?: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
