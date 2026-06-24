import { IncomeSource } from '@prisma/client';

export class IncomeResponseDto {
  id!: string;
  source!: IncomeSource;
  amount!: number;
  date!: Date;
  relatedOrderId?: string | null;
  notes?: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
