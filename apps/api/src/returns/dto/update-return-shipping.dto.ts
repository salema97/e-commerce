import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

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
