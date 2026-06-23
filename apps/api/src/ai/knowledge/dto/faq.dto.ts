import { IsBoolean, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateFaqDto {
  @IsString()
  @MinLength(3)
  question!: string;

  @IsString()
  @MinLength(3)
  answer!: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateFaqDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  question?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  answer?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
