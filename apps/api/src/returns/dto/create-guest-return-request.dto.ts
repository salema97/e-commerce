import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RefundMethod } from '@prisma/client';
import { CreateReturnItemDto } from './create-return.dto.js';

export class CreateGuestReturnRequestDto {
  @ApiProperty({ description: 'Order id to request a return for' })
  @IsUUID() orderId!: string;

  @ApiProperty({ description: 'Email address associated with the order' })
  @IsEmail() email!: string;

  @ApiProperty({ type: [CreateReturnItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateReturnItemDto)
  items!: CreateReturnItemDto[];

  @ApiProperty()
  @IsString() @IsNotEmpty() reason!: string;

  @ApiPropertyOptional({ enum: RefundMethod })
  @IsOptional() @IsEnum(RefundMethod) refundMethod?: RefundMethod;
}
