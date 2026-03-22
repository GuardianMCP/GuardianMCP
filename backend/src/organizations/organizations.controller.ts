import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { UpdateOrgDto } from './dto/update-org.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Role } from '@/common/enums';
import { User } from '@/users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('current')
  async getCurrent(@CurrentUser() user: User) {
    return this.organizationsService.findById(user.orgId);
  }

  @Patch('current')
  @Roles(Role.OWNER)
  async updateCurrent(
    @CurrentUser() user: User,
    @Body() dto: UpdateOrgDto,
  ) {
    return this.organizationsService.update(user.orgId, dto);
  }

  @Post('current/members')
  @Roles(Role.OWNER, Role.ADMIN)
  async inviteMember(
    @CurrentUser() user: User,
    @Body() dto: InviteMemberDto,
  ) {
    return this.organizationsService.invite(user.orgId, dto.email);
  }

  @Delete('current/members/:userId')
  @Roles(Role.OWNER, Role.ADMIN)
  async removeMember(
    @CurrentUser() user: User,
    @Param('userId') userId: string,
  ) {
    await this.organizationsService.removeMember(user.orgId, userId);
    return { message: 'Member removed' };
  }

  @Post('current/api-keys')
  @Roles(Role.OWNER, Role.ADMIN)
  async createApiKey(
    @CurrentUser() user: User,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.organizationsService.createApiKey(user.orgId, dto.name);
  }

  @Get('current/api-keys')
  async getApiKeys(@CurrentUser() user: User) {
    return this.organizationsService.getApiKeys(user.orgId);
  }

  @Delete('current/api-keys/:keyId')
  @Roles(Role.OWNER, Role.ADMIN)
  async deleteApiKey(@Param('keyId') keyId: string) {
    await this.organizationsService.deleteApiKey(keyId);
    return { message: 'API key deleted' };
  }
}
