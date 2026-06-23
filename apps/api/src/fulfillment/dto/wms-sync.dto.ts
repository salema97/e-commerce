import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class WmsInventoryRecordDto {
  @ApiProperty()
  @IsString()
  sku!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  warehouseCode?: string;
}

export class WmsSyncInventoryDto {
  @ApiProperty({ type: [WmsInventoryRecordDto] })
  @Type(() => WmsInventoryRecordDto)
  records!: WmsInventoryRecordDto[];
}

export class WmsTrackingEventDto {
  @ApiProperty()
  @IsString()
  externalShipmentId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;
}

export class WmsImportTrackingDto {
  @ApiProperty({ type: [WmsTrackingEventDto] })
  @Type(() => WmsTrackingEventDto)
  events!: WmsTrackingEventDto[];
}
