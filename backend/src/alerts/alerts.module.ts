import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { AlertRule } from './entities/alert-rule.entity';
import { AlertEvent } from './entities/alert-event.entity';
import { NotificationsModule } from '@/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertRule, AlertEvent]),
    NotificationsModule,
  ],
  providers: [AlertsService],
  controllers: [AlertsController],
  exports: [AlertsService],
})
export class AlertsModule {}
