import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUrl, Min, MinLength } from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty({ example: 'Servientrega' })
  @IsString()
  @MinLength(2)
  carrier!: string;

  @ApiPropertyOptional({ example: 'EC123456789' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ example: 'https://www.servientrega.com.ec/rastreo/EC123456789' })
  @IsOptional()
  @IsUrl()
  trackingUrl?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  shippingCost?: number;
}

export class UpdateReturnShippingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  returnCarrier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  returnTrackingNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  returnTrackingUrl?: string;
}
