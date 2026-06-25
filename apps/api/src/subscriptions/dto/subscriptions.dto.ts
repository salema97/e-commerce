import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { SubscriptionInterval } from '@prisma/client';

export class CreateSubscriptionPlanDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() stripeProductId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() stripePriceId?: string;
  @ApiPropertyOptional({ enum: SubscriptionInterval })
  @IsOptional()
  @IsEnum(SubscriptionInterval)
  interval?: SubscriptionInterval;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) intervalCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) trialDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateSubscriptionPlanDto {
  @ApiPropertyOptional() @IsOptional() @IsString() stripeProductId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() stripePriceId?: string;
  @ApiPropertyOptional({ enum: SubscriptionInterval })
  @IsOptional()
  @IsEnum(SubscriptionInterval)
  interval?: SubscriptionInterval;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) intervalCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) trialDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class SubscribeDto {
  @ApiProperty() @IsUUID() planId!: string;
}
