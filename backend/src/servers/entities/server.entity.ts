import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Scan } from '@/scans/entities/scan.entity';

@Entity('servers')
export class Server extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  repository: string;

  @Column({ nullable: true, default: 'main' })
  defaultBranch: string;

  @Column({ nullable: true })
  lastScanId: string;

  @Column({ type: 'int', default: 100 })
  securityScore: number;

  @Column()
  orgId: string;

  @ManyToOne(() => Organization, (org) => org.servers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orgId' })
  organization: Organization;

  @OneToMany(() => Scan, (scan) => scan.server)
  scans: Scan[];

  @DeleteDateColumn()
  deletedAt: Date;
}
