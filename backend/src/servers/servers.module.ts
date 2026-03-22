import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Server } from './entities/server.entity';
import { Scan } from '@/scans/entities/scan.entity';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server, Scan]),
    BullModule.registerQueue({ name: 'scan-jobs' }),
  ],
  controllers: [ServersController],
  providers: [ServersService],
  exports: [ServersService],
})
export class ServersModule {}
