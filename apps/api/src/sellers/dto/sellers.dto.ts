import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { SellerStatus } from '@prisma/client';

export class CreateSellerDto {
  @ApiProperty() @IsUUID() userId!: string;
  @ApiProperty() @IsString() businessName!: string;
  @ApiProperty() @IsString() slug!: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) commissionRate?: number;
}

export class UpdateSellerDto {
  @ApiPropertyOptional() @IsOptional() @IsString() businessName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) commissionRate?: number;
  @ApiPropertyOptional({ enum: SellerStatus })
  @IsOptional()
  @IsEnum(SellerStatus)
  status?: SellerStatus;
}

export class CreateMarketplaceDisputeDto {
  @ApiProperty() @IsUUID() orderId!: string;
  @ApiProperty() @IsUUID() sellerId!: string;
  @ApiProperty() @IsString() reason!: string;
}

export class ResolveMarketplaceDisputeDto {
  @ApiProperty({ enum: ['RESOLVED_BUYER', 'RESOLVED_SELLER', 'CLOSED'] })
  @IsEnum(['RESOLVED_BUYER', 'RESOLVED_SELLER', 'CLOSED'] as const)
  status!: 'RESOLVED_BUYER' | 'RESOLVED_SELLER' | 'CLOSED';
  @ApiPropertyOptional() @IsOptional() @IsString() resolutionNotes?: string;
}

export class MarkPayoutPaidDto {
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
