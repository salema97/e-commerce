import { CreditNoteStatus } from '@prisma/client';

export class CreditNoteResponseDto {
  id!: string;
  accessKey!: string;
  authorizationNumber?: string | null;
  status!: CreditNoteStatus;
  xmlContent?: string | null;
  totalAmount!: number;
  returnRequestId?: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
