import { IsEnum, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { PaymentProvider } from '@prisma/client';

export class CreateTestPaymentDto {
  @IsUUID()
  orderId!: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;
}
