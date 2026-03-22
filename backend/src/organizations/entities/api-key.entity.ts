import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { Organization } from './organization.entity';

@Entity('api_keys')
export class ApiKey extends BaseEntity {
  @Column()
  name: string;

  @Column({ length: 12 })
  prefix: string;

  @Column()
  hash: string;

  @Column({ nullable: true })
  lastUsedAt: Date;

  @Column()
  orgId: string;

  @ManyToOne(() => Organization, (org) => org.apiKeys, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orgId' })
  organization: Organization;
}
