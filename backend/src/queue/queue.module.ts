import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scan } from '@/scans/entities/scan.entity';
import { Finding } from '@/findings/entities/finding.entity';
import { Server } from '@/servers/entities/server.entity';
import { ScansModule } from '@/scans/scans.module';
import { ScanJobProcessor } from './processors/scan-job.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL'),
        },
      }),
    }),
    BullModule.registerQueue({ name: 'scan-jobs' }),
    TypeOrmModule.forFeature([Scan, Finding, Server]),
    ScansModule,
  ],
  providers: [ScanJobProcessor],
  exports: [BullModule],
})
export class QueueModule {}
