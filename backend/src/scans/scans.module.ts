import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scan } from '@/scans/entities/scan.entity';
import { Finding } from '@/findings/entities/finding.entity';
import { ScansService } from './scans.service';
import { ScansController } from './scans.controller';
import { ScanSseService } from './sse/scan-sse.service';

@Module({
  imports: [TypeOrmModule.forFeature([Scan, Finding])],
  controllers: [ScansController],
  providers: [ScansService, ScanSseService],
  exports: [ScansService, ScanSseService],
})
export class ScansModule {}
