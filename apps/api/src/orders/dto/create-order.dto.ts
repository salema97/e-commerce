import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderChannel, OrderStatus, NetPaymentTerms } from '@prisma/client';
import { IsEcuadorCustomerIdentification } from '../../common/validators/is-ecuador-customer-identification.validator.js';

export class CreateOrderItemDto {
  @ApiProperty()
  @IsUUID() productId!: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID() variantId?: string;

  @ApiProperty()
  @IsInt() @Min(1) quantity!: number;

  @ApiProperty()
  @IsNumber() @Min(0) price!: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiPropertyOptional({ enum: OrderChannel })
  @IsOptional() @IsEnum(OrderChannel) channel?: OrderChannel;

  @ApiPropertyOptional()
  @IsOptional() @IsString() couponCode?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() referralCode?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(0) loyaltyPointsToRedeem?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsEmail() customerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() customerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() customerName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsEcuadorCustomerIdentification()
  customerIdentification?: string;
  @ApiPropertyOptional()
  @IsOptional() @IsString() customerAddress?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Object) shippingAddress?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @Type(() => Object) billingAddress?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID() companyId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() purchaseOrderNumber?: string;

  @ApiPropertyOptional({ enum: NetPaymentTerms })
  @IsOptional() @IsEnum(NetPaymentTerms) netPaymentTerms?: NetPaymentTerms;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus) status!: OrderStatus;
}
