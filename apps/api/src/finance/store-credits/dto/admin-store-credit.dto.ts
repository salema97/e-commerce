import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminStoreCreditDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiPropertyOptional()
  userEmail?: string | null;

  @ApiProperty()
  balance!: number;

  @ApiProperty()
  currency!: string;

  @ApiPropertyOptional()
  expiresAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
