import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { User } from '@/users/entities/user.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { ApiKey } from '@/organizations/entities/api-key.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, Organization, ApiKey]),
  ],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, ApiKeyStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
