import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateChatSessionDto {
  @IsOptional()
  @IsString()
  contactName?: string;
}

export class SendChatMessageDto {
  @IsString()
  @MinLength(1)
  content!: string;
}
