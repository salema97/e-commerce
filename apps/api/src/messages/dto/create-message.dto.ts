import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ example: 'Hello, how can we help?' })
  @IsString()
  @MinLength(1)
  content: string;
}
