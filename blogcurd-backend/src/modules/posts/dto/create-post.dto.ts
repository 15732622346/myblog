import { IsNotEmpty, IsString, IsEnum, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(['draft', 'published', 'private'])
  status?: 'draft' | 'published' | 'private';

  @IsOptional()
  @IsBoolean()
  is_pinned?: boolean;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  category_ids?: number[];
} 