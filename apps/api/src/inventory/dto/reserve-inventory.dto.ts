import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReserveInventoryDto {
  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  quantity: number;
}
