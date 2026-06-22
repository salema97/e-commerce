import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { ConversationStatus } from '@repo/shared-types';

export class UpdateConversationDto {
  @ApiPropertyOptional({ enum: ['OPEN', 'PENDING', 'RESOLVED', 'CLOSED'] })
  @IsOptional()
  @IsEnum(['OPEN', 'PENDING', 'RESOLVED', 'CLOSED'] as const)
  status?: ConversationStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignedAgentId?: string;
}
