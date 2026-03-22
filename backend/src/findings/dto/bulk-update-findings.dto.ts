import {
  IsArray,
  IsUUID,
  IsEnum,
  IsOptional,
  IsString,
  ArrayMinSize,
} from 'class-validator';
import { FindingStatus } from '@/common/enums';

export class BulkUpdateFindingsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  ids: string[];

  @IsEnum(FindingStatus)
  status: FindingStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
