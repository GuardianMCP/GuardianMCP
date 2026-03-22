import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { Server } from '@/servers/entities/server.entity';
import { Finding } from '@/findings/entities/finding.entity';
import { ScanStatus, ScanTrigger } from '@/common/enums';

@Entity('scans')
export class Scan extends BaseEntity {
  @Column({ type: 'enum', enum: ScanStatus, default: ScanStatus.PENDING })
  status: ScanStatus;

  @Column({ type: 'int', nullable: true })
  securityScore: number;

  @Column({ type: 'int', default: 0 })
  filesScanned: number;

  @Column({ type: 'int', default: 0 })
  rulesChecked: number;

  @Column({ type: 'int', nullable: true })
  durationMs: number;

  @Column({ nullable: true })
  cliVersion: string;

  @Column({ nullable: true })
  reportUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };

  @Column({ nullable: true })
  branch: string;

  @Column({ type: 'enum', enum: ScanTrigger, default: ScanTrigger.CLI })
  trigger: ScanTrigger;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column()
  serverId: string;

  @Column()
  orgId: string;

  @ManyToOne(() => Server, (server) => server.scans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @OneToMany(() => Finding, (finding) => finding.scan)
  findings: Finding[];
}
