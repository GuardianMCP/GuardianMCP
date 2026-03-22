import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { Plan } from '@/common/enums';
import { User } from '@/users/entities/user.entity';
import { ApiKey } from './api-key.entity';
import { Server } from '@/servers/entities/server.entity';

@Entity('organizations')
export class Organization extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'enum', enum: Plan, default: Plan.FREE })
  plan: Plan;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  @OneToMany(() => User, (user) => user.organization)
  members: User[];

  @OneToMany(() => ApiKey, (key) => key.organization)
  apiKeys: ApiKey[];

  @OneToMany(() => Server, (server) => server.organization)
  servers: Server[];
}
