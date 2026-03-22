import { Controller, Get, Param, ParseUUIDPipe, Query, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ScansService } from './scans.service';
import { ScanSseService } from './sse/scan-sse.service';
import { QueryScanDto } from './dto/query-scan.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('scans')
export class ScansController {
  constructor(
    private readonly scansService: ScansService,
    private readonly scanSseService: ScanSseService,
  ) {}

  @Get()
  findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() query: QueryScanDto,
  ) {
    return this.scansService.findAll(orgId, query);
  }

  @Get(':id')
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.scansService.findById(id, orgId);
  }

  @Sse(':id/stream')
  stream(@Param('id') id: string): Observable<MessageEvent> {
    return this.scanSseService.getStream(id) as Observable<MessageEvent>;
  }

  @Get(':id/report')
  getReport(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.scansService.getReport(id, orgId);
  }
}
