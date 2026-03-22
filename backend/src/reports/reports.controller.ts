import { Controller, Post, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post(':scanId/generate')
  generate(
    @Param('scanId') scanId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.reportsService.generateReport(scanId, orgId);
  }
}
