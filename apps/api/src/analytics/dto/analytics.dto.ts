import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

const ANALYTICS_EVENTS = [
  'product_view',
  'add_to_cart',
  'remove_from_cart',
  'begin_checkout',
  'purchase',
  'search',
  'filter',
] as const;

export class TrackAnalyticsEventDto {
  @IsIn(ANALYTICS_EVENTS as unknown as string[])
  event!: (typeof ANALYTICS_EVENTS)[number];

  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  sessionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  userId?: string;

  @IsOptional()
  @IsIn(['web', 'mobile', 'api'])
  source?: 'web' | 'mobile' | 'api';
}

export class ReportClientErrorDto {
  @IsString()
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  sessionId?: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}
