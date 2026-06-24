import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBackInStockAlertDto {
  @ApiProperty({ example: 'cliente@example.com' })
  @IsEmail()
  email!: string;
}
