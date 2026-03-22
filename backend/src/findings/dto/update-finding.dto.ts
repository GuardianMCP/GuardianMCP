import { IsOptional, IsEnum, IsString } from 'class-validator';
import { FindingStatus } from '@/common/enums';

export class UpdateFindingDto {
  @IsOptional()
  @IsEnum(FindingStatus)
  status?: FindingStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
