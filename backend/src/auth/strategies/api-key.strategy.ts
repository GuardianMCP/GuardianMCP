import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ApiKey } from '@/organizations/entities/api-key.entity';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
  ) {
    super();
  }

  async validate(req: Request): Promise<{ orgId: string; apiKeyId: string }> {
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey || !apiKey.startsWith('gmcp_')) {
      throw new UnauthorizedException('Invalid API key');
    }

    const prefix = apiKey.substring(0, 12);
    const candidates = await this.apiKeyRepo.find({ where: { prefix } });

    for (const candidate of candidates) {
      const isMatch = await bcrypt.compare(apiKey, candidate.hash);
      if (isMatch) {
        await this.apiKeyRepo.update(candidate.id, { lastUsedAt: new Date() });
        return { orgId: candidate.orgId, apiKeyId: candidate.id };
      }
    }

    throw new UnauthorizedException('Invalid API key');
  }
}
