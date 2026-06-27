import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class IssueSupplementaryDocumentDto {
  @ApiProperty({ enum: ['05', '06', '07'] })
  @IsIn(['05', '06', '07'])
  documentType!: '05' | '06' | '07';

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  orderId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentInvoiceAccessKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  shipmentId?: string;

  @ApiPropertyOptional({ description: 'Carrier guide number (e.g. Servientrega)' })
  @IsOptional()
  @IsString()
  carrierGuideNumber?: string;
}
