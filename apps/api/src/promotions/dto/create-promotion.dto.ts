import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  Validate,
} from 'class-validator';
import { PromotionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { PromotionDateWindowConstraint } from './promotion-date-window.constraint.js';

export class CreatePromotionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEnum(PromotionType)
  type!: PromotionType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  value?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  @Validate(PromotionDateWindowConstraint)
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
