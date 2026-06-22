import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RefundMethod } from '@prisma/client';

export class ResolveReturnDto {
  @ApiProperty({ enum: RefundMethod, description: 'How the return will be settled' })
  @IsEnum(RefundMethod)
  refundMethod!: RefundMethod;

  @ApiPropertyOptional({ description: 'Internal notes about the resolution' })
  @IsOptional() @IsString() notes?: string;

  @ApiPropertyOptional({ description: 'Replacement product ids for EXCHANGE' })
  @IsOptional()
  @IsUUID('4', { each: true })
  exchangeProductIds?: string[];
}
