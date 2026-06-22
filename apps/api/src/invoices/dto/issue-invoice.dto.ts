import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class IssueInvoiceDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsOptional()
  documentType?: string;
}
