import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { MarketplaceChannel } from '@prisma/client';

class MarketplaceImportItemDto {
  @IsUUID() productId!: string;
  @IsOptional() @IsUUID() variantId?: string;
  @IsNumber() @Min(1) quantity!: number;
  @IsNumber() @Min(0) price!: number;
  @IsString() name!: string;
  @IsString() sku!: string;
}

export class MarketplaceImportOrderDto {
  @IsEnum(MarketplaceChannel) channel!: MarketplaceChannel;
  @IsString() externalOrderId!: string;
  @IsEmail() customerEmail!: string;
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsNumber() @Min(0) fees?: number;
  @IsArray() @ValidateNested({ each: true }) @Type(() => MarketplaceImportItemDto)
  items!: MarketplaceImportItemDto[];
}
