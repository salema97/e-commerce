import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminGiftCardDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  initialBalance!: number;

  @ApiProperty()
  balance!: number;

  @ApiProperty()
  currency!: string;

  @ApiPropertyOptional()
  expiresAt?: Date | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiPropertyOptional()
  issuedToUserId?: string | null;

  @ApiPropertyOptional()
  issuedToUserEmail?: string | null;

  @ApiPropertyOptional()
  note?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
