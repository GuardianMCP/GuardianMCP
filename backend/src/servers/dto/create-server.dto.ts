import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateServerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  repository?: string;
}
