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
import { OrderChannel, OrderStatus } from '@prisma/client';

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
  @IsOptional() @IsEmail() customerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() customerPhone?: string;

  @ApiPropertyOptional() @IsOptional() shippingAddress?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() billingAddress?: Record<string, unknown>;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus) status!: OrderStatus;
}
