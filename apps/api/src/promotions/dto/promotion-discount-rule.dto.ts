import { IsInt, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePromotionDiscountRuleDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minimumQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minimumAmount?: number;

  @IsOptional()
  @IsUUID()
  applicableProductId?: string;

  @IsOptional()
  @IsUUID()
  applicableCategoryId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountValue?: number;
}

export class UpdatePromotionDiscountRuleDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minimumQuantity?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minimumAmount?: number | null;

  @IsOptional()
  @IsUUID()
  applicableProductId?: string | null;

  @IsOptional()
  @IsUUID()
  applicableCategoryId?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountValue?: number | null;
}
