import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateFileDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  original_name: string;

  @IsString()
  @IsNotEmpty()
  file_path: string;

  @IsString()
  @IsNotEmpty()
  mime_type: string;

  @IsNumber()
  @IsNotEmpty()
  size: number;
} 
 