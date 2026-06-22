import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IssueCreditNoteDto {
  @ApiProperty({ description: 'Return request id to issue the credit note for' })
  @IsString()
  @IsNotEmpty()
  returnRequestId!: string;

  @ApiPropertyOptional({ description: 'Override the total credit amount' })
  @IsOptional()
  @IsString()
  total?: string;
}
