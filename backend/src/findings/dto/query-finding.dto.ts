import { IsOptional, IsUUID, IsString, IsEnum } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { Severity, FindingStatus } from '@/common/enums';

export class QueryFindingDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  serverId?: string;

  @IsOptional()
  @IsString()
  ruleId?: string;

  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @IsOptional()
  @IsEnum(FindingStatus)
  status?: FindingStatus;
}
