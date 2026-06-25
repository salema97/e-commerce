import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { InvoiceStatus, PaymentProvider } from '@prisma/client';

export class CreateTestInvoiceDto {
  @IsUUID()
  orderId!: string;

  @IsOptional()
  @IsString()
  accessKey?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  authorizationNumber?: string | null;
}
