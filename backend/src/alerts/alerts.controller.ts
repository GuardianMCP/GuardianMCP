import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  findAll(@CurrentUser('orgId') orgId: string) {
    return this.alertsService.findAll(orgId);
  }

  @Post()
  create(
    @CurrentUser('orgId') orgId: string,
    @Body() body: { name: string; triggerType: string; conditions?: Record<string, unknown>; channel: string; channelConfig: Record<string, unknown> },
  ) {
    return this.alertsService.create(orgId, body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() body: Partial<{ name: string; enabled: boolean; conditions: Record<string, unknown>; channelConfig: Record<string, unknown> }>,
  ) {
    return this.alertsService.update(id, orgId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.alertsService.remove(id, orgId);
  }
}
