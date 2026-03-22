import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertRule } from './entities/alert-rule.entity';
import { AlertEvent } from './entities/alert-event.entity';
import { NotificationsService } from '@/notifications/notifications.service';
import { Severity } from '@/common/enums';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(AlertRule)
    private readonly ruleRepo: Repository<AlertRule>,
    @InjectRepository(AlertEvent)
    private readonly eventRepo: Repository<AlertEvent>,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(orgId: string) {
    return this.ruleRepo.find({ where: { orgId }, order: { createdAt: 'DESC' } });
  }

  async create(orgId: string, data: Partial<AlertRule>) {
    const rule = this.ruleRepo.create({ ...data, orgId });
    return this.ruleRepo.save(rule);
  }

  async update(id: string, orgId: string, data: Partial<AlertRule>) {
    const rule = await this.ruleRepo.findOne({ where: { id, orgId } });
    if (!rule) throw new NotFoundException('Alert rule not found');
    Object.assign(rule, data);
    return this.ruleRepo.save(rule);
  }

  async remove(id: string, orgId: string) {
    const rule = await this.ruleRepo.findOne({ where: { id, orgId } });
    if (!rule) throw new NotFoundException('Alert rule not found');
    await this.ruleRepo.remove(rule);
  }

  async evaluateAlerts(
    orgId: string,
    scanId: string,
    severityCounts: Record<Severity, number>,
  ) {
    const rules = await this.ruleRepo.find({
      where: { orgId, enabled: true },
    });

    for (const rule of rules) {
      const shouldTrigger = this.checkTrigger(rule, severityCounts);
      if (!shouldTrigger) continue;

      const message = `Alert "${rule.name}" triggered: scan ${scanId} found ${severityCounts[Severity.CRITICAL]} critical, ${severityCounts[Severity.HIGH]} high findings.`;

      const event = this.eventRepo.create({
        alertRuleId: rule.id,
        scanId,
        message,
        delivered: false,
      });
      await this.eventRepo.save(event);

      await this.dispatch(rule, message);
      event.delivered = true;
      await this.eventRepo.save(event);
    }
  }

  private checkTrigger(
    rule: AlertRule,
    counts: Record<Severity, number>,
  ): boolean {
    switch (rule.triggerType) {
      case 'severity_threshold': {
        const threshold = (rule.conditions as { severity?: Severity })?.severity || Severity.HIGH;
        const severityOrder = [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW, Severity.INFO];
        const thresholdIdx = severityOrder.indexOf(threshold);
        return severityOrder.slice(0, thresholdIdx + 1).some((s) => counts[s] > 0);
      }
      case 'new_finding':
        return Object.values(counts).some((c) => c > 0);
      default:
        return false;
    }
  }

  private async dispatch(rule: AlertRule, message: string) {
    const config = rule.channelConfig as Record<string, unknown>;

    if (rule.channel === 'email' && config.recipients) {
      await this.notifications.sendEmail(
        config.recipients as string[],
        `GuardianMCP Alert: ${rule.name}`,
        `<p>${message}</p>`,
      );
    }

    if (rule.channel === 'slack' && config.webhookUrl) {
      await this.notifications.sendSlackWebhook(
        config.webhookUrl as string,
        message,
      );
    }
  }
}
