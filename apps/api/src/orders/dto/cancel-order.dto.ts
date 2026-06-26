import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelOrderDto {
  @ApiPropertyOptional({
    description: 'Email used at checkout for guest orders without an account',
    example: 'guest@example.com',
  })
  @IsOptional()
  @IsString()
  guestEmail?: string;
}
