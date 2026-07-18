import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FileQueryDto {
  @IsOptional()
  @IsString()
  mime_type?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;
} 
 