import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { User } from '@/users/entities/user.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role, Plan } from '@/common/enums';

@Injectable()
export class AuthService {
  private redis: Redis;

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Organization) private readonly orgRepo: Repository<Organization>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.redis = new Redis(this.configService.get<string>('REDIS_URL', 'redis://localhost:6379'));
  }

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const orgName = dto.orgName || `${dto.name || dto.email.split('@')[0]}'s Org`;
    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const org = this.orgRepo.create({
      name: orgName,
      slug: `${slug}-${Date.now().toString(36)}`,
      plan: Plan.FREE,
    });
    const savedOrg = await this.orgRepo.save(org);

    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: Role.OWNER,
      orgId: savedOrg.id,
    });
    const savedUser = await this.userRepo.save(user);

    return this.generateTokens(savedUser);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string) {
    const isBlacklisted = await this.redis.get(`blacklist:${refreshToken}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Blacklist old refresh token (rotation)
      await this.redis.set(
        `blacklist:${refreshToken}`,
        '1',
        'EX',
        7 * 24 * 60 * 60,
      );

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    await this.redis.set(
      `blacklist:${refreshToken}`,
      '1',
      'EX',
      7 * 24 * 60 * 60,
    );
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      orgId: user.orgId,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_TTL', '15m'),
      }),
      this.jwtService.signAsync(
        { sub: user.id, email: user.email },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_TTL', '7d'),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
      },
    };
  }
}
