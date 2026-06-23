import { CreditNoteStatus } from '@prisma/client';

export class CreditNoteResponseDto {
  id!: string;
  accessKey!: string;
  parentInvoiceAccessKey?: string | null;
  authorizationNumber?: string | null;
  status!: CreditNoteStatus;
  totalAmount!: number;
  returnRequestId?: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
