import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseCategoryDto {
  @ApiProperty({ example: 'Logistics' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Shipping and courier costs' })
  @IsOptional()
  @IsString()
  description?: string;
}
