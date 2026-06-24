import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { QuoteStatus } from '@prisma/client';

export class CreateQuoteLineDto {
  @IsUUID() productId!: string;
  @IsOptional() @IsUUID() variantId?: string;
  @IsInt() @Min(1) quantity!: number;
  @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
}

export class CreateQuoteDto {
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsString() purchaseOrderNumber?: string;
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsOptional() @IsString() notes?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateQuoteLineDto)
  items!: CreateQuoteLineDto[];
}

export class UpdateQuoteStatusDto {
  @IsEnum(QuoteStatus) status!: QuoteStatus;
}
