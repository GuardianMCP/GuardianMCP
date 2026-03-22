import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository, ILike } from 'typeorm';
import { Server } from './entities/server.entity';
import { Scan } from '@/scans/entities/scan.entity';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { QueryServerDto } from './dto/query-server.dto';
import { PaginatedResponseDto } from '@/common/dto/paginated-response.dto';
import { ScanStatus, ScanTrigger } from '@/common/enums';
import { ScanJobPayload } from '@/queue/interfaces/scan-job.interface';

@Injectable()
export class ServersService {
  private readonly logger = new Logger(ServersService.name);

  constructor(
    @InjectRepository(Server)
    private readonly serverRepo: Repository<Server>,
    @InjectRepository(Scan)
    private readonly scanRepo: Repository<Scan>,
    @InjectQueue('scan-jobs')
    private readonly scanQueue: Queue<ScanJobPayload>,
  ) {}

  async create(orgId: string, dto: CreateServerDto): Promise<Server> {
    const server = this.serverRepo.create({
      ...dto,
      orgId,
    });
    return this.serverRepo.save(server);
  }

  async findAll(
    orgId: string,
    query: QueryServerDto,
  ): Promise<PaginatedResponseDto<Server>> {
    const { page = 1, limit = 20, name } = query;

    const where: Record<string, unknown> = { orgId };
    if (name) {
      where.name = ILike(`%${name}%`);
    }

    const [data, total] = await this.serverRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findById(id: string, orgId: string): Promise<Server> {
    const server = await this.serverRepo.findOne({
      where: { id, orgId },
    });
    if (!server) throw new NotFoundException('Server not found');
    return server;
  }

  async update(
    id: string,
    orgId: string,
    dto: UpdateServerDto,
  ): Promise<Server> {
    const server = await this.findById(id, orgId);
    Object.assign(server, dto);
    return this.serverRepo.save(server);
  }

  async remove(id: string, orgId: string): Promise<void> {
    const server = await this.findById(id, orgId);
    await this.serverRepo.softRemove(server);
  }

  async triggerScan(
    id: string,
    orgId: string,
    branch?: string,
  ): Promise<Scan> {
    const server = await this.findById(id, orgId);

    if (!server.repository) {
      throw new BadRequestException(
        'Server does not have a repository URL configured',
      );
    }

    const targetBranch = branch || server.defaultBranch || 'main';

    const scan = this.scanRepo.create({
      serverId: server.id,
      orgId,
      status: ScanStatus.PENDING,
      trigger: ScanTrigger.DASHBOARD,
      branch: targetBranch,
    });

    const savedScan = await this.scanRepo.save(scan);

    await this.scanQueue.add('scan', {
      scanId: savedScan.id,
      serverId: server.id,
      orgId,
      repoUrl: server.repository,
      branch: targetBranch,
    });

    this.logger.log(
      `Queued scan ${savedScan.id} for ${server.name}@${targetBranch}`,
    );

    return savedScan;
  }

  async getBranches(
    id: string,
    orgId: string,
  ): Promise<{ branches: string[]; defaultBranch: string }> {
    const server = await this.findById(id, orgId);

    if (!server.repository) {
      throw new BadRequestException(
        'Server does not have a repository URL configured',
      );
    }

    const { owner, repo } = this.parseGitHubUrl(server.repository);

    // Fetch repo info for default branch
    const repoRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'GuardianMCP' },
      },
    );

    let defaultBranch = server.defaultBranch || 'main';
    if (repoRes.ok) {
      const repoData = await repoRes.json();
      defaultBranch = repoData.default_branch ?? defaultBranch;
    }

    // Fetch branches
    const branchesRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
      {
        headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'GuardianMCP' },
      },
    );

    let branches: string[] = [defaultBranch];
    if (branchesRes.ok) {
      const branchesData = await branchesRes.json();
      branches = branchesData.map((b: { name: string }) => b.name);
    }

    return { branches, defaultBranch };
  }

  private parseGitHubUrl(url: string): { owner: string; repo: string } {
    // Supports: https://github.com/owner/repo, https://github.com/owner/repo.git
    const match = url.match(
      /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/,
    );
    if (!match) {
      throw new BadRequestException(
        'Invalid GitHub repository URL. Expected format: https://github.com/owner/repo',
      );
    }
    return { owner: match[1], repo: match[2] };
  }
}
