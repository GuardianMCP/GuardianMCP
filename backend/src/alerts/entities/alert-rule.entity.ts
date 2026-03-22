import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { AlertEvent } from './alert-event.entity';

@Entity('alert_rules')
export class AlertRule extends BaseEntity {
  @Column()
  name: string;

  @Column()
  triggerType: string; // severity_threshold | new_finding | scan_failed

  @Column({ type: 'jsonb', nullable: true })
  conditions: Record<string, unknown>;

  @Column()
  channel: string; // email | slack

  @Column({ type: 'jsonb' })
  channelConfig: Record<string, unknown>;

  @Column({ default: true })
  enabled: boolean;

  @Column()
  orgId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orgId' })
  organization: Organization;

  @OneToMany(() => AlertEvent, (event) => event.alertRule)
  events: AlertEvent[];
}
