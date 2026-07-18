import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAdvertisementDto {
  @IsString()
  @IsNotEmpty()
  content: string;
} 