import { IsOptional, IsString } from 'class-validator';

export class TriggerScanDto {
  @IsOptional()
  @IsString()
  branch?: string;
}
