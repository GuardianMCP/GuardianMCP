import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FindingsService } from './findings.service';
import { QueryFindingDto } from './dto/query-finding.dto';
import { UpdateFindingDto } from './dto/update-finding.dto';
import { BulkUpdateFindingsDto } from './dto/bulk-update-findings.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('findings')
export class FindingsController {
  constructor(private readonly findingsService: FindingsService) {}

  @Get()
  findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() query: QueryFindingDto,
  ) {
    return this.findingsService.findAll(orgId, query);
  }

  @Get(':id')
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.findingsService.findById(id, orgId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateFindingDto,
  ) {
    return this.findingsService.update(id, orgId, dto);
  }

  @Post('bulk')
  bulkUpdate(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: BulkUpdateFindingsDto,
  ) {
    return this.findingsService.bulkUpdate(orgId, dto);
  }
}
