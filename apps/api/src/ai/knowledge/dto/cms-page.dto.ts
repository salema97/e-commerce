import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCmsPageDto {
  @IsString()
  @MinLength(2)
  slug!: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @MinLength(10)
  bodyMarkdown!: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateCmsPageDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  bodyMarkdown?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
