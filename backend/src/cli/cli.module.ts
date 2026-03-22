import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scan } from '@/scans/entities/scan.entity';
import { Finding } from '@/findings/entities/finding.entity';
import { Server } from '@/servers/entities/server.entity';
import { CliController } from './cli.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Scan, Finding, Server])],
  controllers: [CliController],
})
export class CliModule {}
