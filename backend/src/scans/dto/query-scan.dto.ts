import { IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ScanStatus } from '@/common/enums';

export class QueryScanDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  serverId?: string;

  @IsOptional()
  @IsEnum(ScanStatus)
  status?: ScanStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
