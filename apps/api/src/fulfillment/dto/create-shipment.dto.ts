import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ShipmentLineDto {
  @ApiProperty()
  @IsString()
  orderItemId!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity!: number;
}

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

  @ApiPropertyOptional({ type: [ShipmentLineDto], description: 'Split-shipment line items' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShipmentLineDto)
  items?: ShipmentLineDto[];
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
