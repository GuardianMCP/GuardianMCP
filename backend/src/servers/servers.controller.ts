import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ServersService } from './servers.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { QueryServerDto } from './dto/query-server.dto';
import { TriggerScanDto } from './dto/trigger-scan.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { User } from '@/users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateServerDto,
  ) {
    return this.serversService.create(user.orgId, dto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query() query: QueryServerDto,
  ) {
    return this.serversService.findAll(user.orgId, query);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.serversService.findById(id, user.orgId);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateServerDto,
  ) {
    return this.serversService.update(id, user.orgId, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    await this.serversService.remove(id, user.orgId);
    return { message: 'Server deleted' };
  }

  @Get(':id/branches')
  async getBranches(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.serversService.getBranches(id, user.orgId);
  }

  @Post(':id/scans')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerScan(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: TriggerScanDto,
  ) {
    return this.serversService.triggerScan(id, user.orgId, dto.branch);
  }
}
