import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateResumeDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
} 