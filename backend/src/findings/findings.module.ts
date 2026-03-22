import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Finding } from '@/findings/entities/finding.entity';
import { FindingsService } from './findings.service';
import { FindingsController } from './findings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Finding])],
  controllers: [FindingsController],
  providers: [FindingsService],
  exports: [FindingsService],
})
export class FindingsModule {}
