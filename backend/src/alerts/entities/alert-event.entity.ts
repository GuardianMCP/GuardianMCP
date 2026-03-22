import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { AlertRule } from './alert-rule.entity';
import { Scan } from '@/scans/entities/scan.entity';

@Entity('alert_events')
export class AlertEvent extends BaseEntity {
  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  delivered: boolean;

  @Column()
  alertRuleId: string;

  @Column({ nullable: true })
  scanId: string;

  @ManyToOne(() => AlertRule, (rule) => rule.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'alertRuleId' })
  alertRule: AlertRule;

  @ManyToOne(() => Scan, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'scanId' })
  scan: Scan;
}
