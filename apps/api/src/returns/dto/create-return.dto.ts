import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RefundMethod, ReturnItemCondition } from '@prisma/client';

export class CreateReturnItemDto {
  @ApiProperty()
  @IsUUID() productId!: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID() productVariantId?: string;

  @ApiProperty()
  @IsInt() @Min(1) quantity!: number;

  @ApiPropertyOptional({ enum: ReturnItemCondition })
  @IsOptional() @IsEnum(ReturnItemCondition) condition?: ReturnItemCondition;

  @ApiPropertyOptional({ description: 'Per-unit refund value in major currency units' })
  @IsOptional() @Min(0) refundValue?: number;
}

export class CreateReturnDto {
  @ApiProperty({ type: [CreateReturnItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateReturnItemDto)
  items!: CreateReturnItemDto[];

  @ApiProperty()
  @IsString() @IsNotEmpty() reason!: string;

  @ApiPropertyOptional({ enum: RefundMethod })
  @IsOptional() @IsEnum(RefundMethod) refundMethod?: RefundMethod;
}
