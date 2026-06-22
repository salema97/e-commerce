import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RefundMethod, ReturnStatus } from '@prisma/client';

export class UpdateReturnStatusDto {
  @ApiProperty({ enum: ReturnStatus })
  @IsEnum(ReturnStatus) status!: ReturnStatus;

  @ApiPropertyOptional({ enum: RefundMethod, description: 'Required when transitioning to RESOLVED' })
  @IsOptional() @IsEnum(RefundMethod) refundMethod?: RefundMethod;

  @ApiPropertyOptional()
  @IsOptional() @IsString() notes?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID() @IsNotEmpty() creditNoteId?: string;
}
