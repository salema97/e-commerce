import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ShippingQuoteDto {
  @ApiPropertyOptional({ example: 'EC' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'Pichincha' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ example: 75.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal!: number;

  @ApiPropertyOptional({ description: 'Coupon grants free shipping' })
  @IsOptional()
  @IsBoolean()
  freeShipping?: boolean;
}
