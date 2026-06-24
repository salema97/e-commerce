import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import type { ShipmentStatus } from '@repo/shared-types';

const SHIPMENT_STATUSES = [
  'PENDING',
  'LABEL_CREATED',
  'IN_TRANSIT',
  'DELIVERED',
  'RETURNED',
  'CANCELLED',
] as const satisfies readonly ShipmentStatus[];

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

  @ApiProperty({ required: false, enum: SHIPMENT_STATUSES })
  @IsOptional()
  @IsIn(SHIPMENT_STATUSES)
  status?: ShipmentStatus;
}

export class WmsImportTrackingDto {
  @ApiProperty({ type: [WmsTrackingEventDto] })
  @Type(() => WmsTrackingEventDto)
  events!: WmsTrackingEventDto[];
}
