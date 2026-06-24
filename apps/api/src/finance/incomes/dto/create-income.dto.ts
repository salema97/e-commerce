import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IncomeSource } from '@prisma/client';

export class CreateIncomeDto {
  @ApiProperty({ enum: IncomeSource, example: IncomeSource.ORDER })
  @IsEnum(IncomeSource)
  source!: IncomeSource;

  @ApiProperty({ example: 150.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  relatedOrderId?: string;

  @ApiPropertyOptional({ example: 'March storefront sales' })
  @IsOptional()
  @IsString()
  notes?: string;
}
