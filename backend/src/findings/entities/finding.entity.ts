import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { Scan } from '@/scans/entities/scan.entity';
import { Severity, FindingStatus } from '@/common/enums';

@Entity('findings')
@Index(['serverId', 'status'])
@Index(['orgId', 'severity', 'status'])
@Index(['fingerprint'])
export class Finding extends BaseEntity {
  @Column()
  ruleId: string;

  @Column()
  ruleName: string;

  @Column({ type: 'enum', enum: Severity })
  severity: Severity;

  @Column({ type: 'enum', enum: FindingStatus, default: FindingStatus.OPEN })
  status: FindingStatus;

  @Column()
  file: string;

  @Column({ type: 'int' })
  line: number;

  @Column({ type: 'int', default: 1 })
  column: number;

  @Column({ type: 'text' })
  snippet: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text' })
  remediation: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column()
  confidence: string;

  @Column({ type: 'simple-array', nullable: true })
  cveRefs: string[];

  @Column({ type: 'simple-array', nullable: true })
  owaspRefs: string[];

  @Column()
  fingerprint: string;

  @Column()
  scanId: string;

  @Column()
  serverId: string;

  @Column()
  orgId: string;

  @ManyToOne(() => Scan, (scan) => scan.findings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scanId' })
  scan: Scan;
}
