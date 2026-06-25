import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { CompanyUserRole, NetPaymentTerms } from '@prisma/client';

export class CreateCompanyDto {
  @IsString() name!: string;
  @IsString() taxId!: string;
  @IsOptional() @IsNumber() @Min(0) creditLimit?: number;
  @IsOptional() @IsEnum(NetPaymentTerms) netPaymentTerms?: NetPaymentTerms;
}

export class UpdateCompanyDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() @Min(0) creditLimit?: number;
  @IsOptional() @IsEnum(NetPaymentTerms) netPaymentTerms?: NetPaymentTerms;
  @IsOptional() isActive?: boolean;
}

export class UpsertCompanyPriceDto {
  @IsUUID() productId!: string;
  @IsOptional() @IsUUID() variantId?: string;
  @IsNumber() @Min(0) unitPrice!: number;
  @IsOptional() @IsNumber() @Min(1) minQuantity?: number;
}

export class AddCompanyUserDto {
  @IsUUID() userId!: string;
  @IsOptional() @IsEnum(CompanyUserRole) role?: CompanyUserRole;
}

export class BulkOrderRowDto {
  @IsUUID() productId!: string;
  @IsOptional() @IsUUID() variantId?: string;
  @IsNumber() @Min(1) quantity!: number;
  @IsOptional() @IsString() sku?: string;
}

export class BulkOrderImportDto {
  rows!: BulkOrderRowDto[];
}
