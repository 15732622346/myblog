import { IsOptional, IsString, IsNotEmpty, IsArray, IsEnum } from 'class-validator';
import { WorkStatus } from '../entities/work.entity';

export class CreateWorkDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  cover_url?: string;

  @IsString()
  @IsOptional()
  demo_url?: string;

  @IsString()
  @IsOptional()
  github_url?: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsArray()
  @IsOptional()
  tech_stack?: string[];

  @IsEnum(WorkStatus)
  @IsOptional()
  status?: WorkStatus;

  @IsOptional()
  is_featured?: boolean;
} 