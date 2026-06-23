import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const SEGMENTS = [
  'ALL_CUSTOMERS',
  'HAS_ACTIVE_CART',
  'RECENT_BUYERS',
  'INACTIVE_BUYERS',
] as const;

export class DistributePromoDto {
  @ApiProperty({ enum: SEGMENTS })
  @IsIn(SEGMENTS)
  segment!: (typeof SEGMENTS)[number];

  @ApiProperty()
  @IsString()
  promotionId!: string;
}
