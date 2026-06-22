import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID, IsIn, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const productStatuses = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
type ProductStatus = (typeof productStatuses)[number];

export class CreateProductVariantDto {
  @ApiProperty({ example: 'PROD-001-BLK' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 'Black' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 19.99 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  price?: number;
}

export class CreateProductAttributeDto {
  @ApiProperty({ example: 'Color' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Black' })
  @IsString()
  value: string;
}

export class CreateProductImageDto {
  @ApiProperty({ example: 'https://cdn.example.com/image.png' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ example: 'Product photo' })
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Wireless Headphones' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'wireless-headphones' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: 'High-quality wireless headphones' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'PROD-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ enum: productStatuses, example: 'ACTIVE' })
  @IsOptional()
  @IsIn(productStatuses)
  status?: ProductStatus;

  @ApiProperty({ example: 49.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 59.99 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  compareAtPrice?: number;

  @ApiPropertyOptional({ example: 25.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000000' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000001' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ type: [CreateProductVariantDto] })
  @IsOptional()
  variants?: CreateProductVariantDto[];

  @ApiPropertyOptional({ type: [CreateProductAttributeDto] })
  @IsOptional()
  attributes?: CreateProductAttributeDto[];

  @ApiPropertyOptional({ type: [CreateProductImageDto] })
  @IsOptional()
  images?: CreateProductImageDto[];
}
