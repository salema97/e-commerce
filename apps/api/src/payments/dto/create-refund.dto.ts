import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRefundDto {
  @ApiProperty({ description: 'Refund amount in major currency units' })
  @IsNumber() @Min(0.01) amount!: number;

  @ApiProperty({ enum: ['full', 'partial'] })
  @IsEnum(['full', 'partial']) type!: 'full' | 'partial';

  @ApiPropertyOptional()
  @IsOptional() @IsString() reason?: string;
}

export class ApproveRefundParamsDto {
  @ApiProperty()
  @IsUUID() @IsNotEmpty() id!: string;
}
