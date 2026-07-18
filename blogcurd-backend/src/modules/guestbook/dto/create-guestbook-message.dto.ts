import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateGuestbookMessageDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  visitor_name?: string;
} 