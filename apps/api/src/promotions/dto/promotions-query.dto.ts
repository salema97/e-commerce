import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PromotionType } from '@prisma/client';
import { Type } from 'class-transformer';

export class PromotionsQueryDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsEnum(PromotionType)
  type?: PromotionType;
}
