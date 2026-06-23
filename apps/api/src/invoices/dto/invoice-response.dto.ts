import { InvoiceStatus } from '../invoice-status.enum.js';

export class InvoiceResponseDto {
  id!: string;
  orderId!: string;
  documentType!: string;
  accessKey!: string;
  authorizationNumber?: string | null;
  status!: InvoiceStatus;
  createdAt!: Date;
  updatedAt!: Date;
}
