import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Scan } from '@/scans/entities/scan.entity';
import { Finding } from '@/findings/entities/finding.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Scan, Finding])],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
