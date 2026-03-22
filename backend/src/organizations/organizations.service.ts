import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Organization } from './entities/organization.entity';
import { ApiKey } from './entities/api-key.entity';
import { User } from '@/users/entities/user.entity';
import { Role } from '@/common/enums';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<Organization> {
    const org = await this.orgRepo.findOne({
      where: { id },
      relations: ['members'],
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(
    id: string,
    data: Partial<Pick<Organization, 'name' | 'slug'>>,
  ): Promise<Organization> {
    await this.orgRepo.update(id, data);
    return this.findById(id);
  }

  async invite(orgId: string, email: string): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const user = this.userRepo.create({
      email,
      passwordHash: '',
      orgId,
      role: Role.MEMBER,
    });

    return this.userRepo.save(user);
  }

  async removeMember(orgId: string, userId: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId, orgId },
    });
    if (!user) throw new NotFoundException('Member not found in organization');

    user.orgId = null as unknown as string;
    await this.userRepo.save(user);
  }

  async createApiKey(
    orgId: string,
    name: string,
  ): Promise<{ id: string; name: string; prefix: string; rawKey: string }> {
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const rawKey = `gmcp_live_${randomBytes}`;
    const prefix = rawKey.slice(0, 12);

    const saltRounds = 10;
    const hash = await bcrypt.hash(rawKey, saltRounds);

    const apiKey = this.apiKeyRepo.create({
      name,
      prefix,
      hash,
      orgId,
    });

    const saved = await this.apiKeyRepo.save(apiKey);

    return {
      id: saved.id,
      name: saved.name,
      prefix: saved.prefix,
      rawKey,
    };
  }

  async deleteApiKey(id: string): Promise<void> {
    const result = await this.apiKeyRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('API key not found');
    }
  }

  async getApiKeys(
    orgId: string,
  ): Promise<{ id: string; name: string; prefix: string; lastUsedAt: Date }[]> {
    const keys = await this.apiKeyRepo.find({
      where: { orgId },
      select: ['id', 'name', 'prefix', 'lastUsedAt', 'createdAt'],
      order: { createdAt: 'DESC' },
    });

    return keys.map((key) => ({
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      lastUsedAt: key.lastUsedAt,
    }));
  }
}
