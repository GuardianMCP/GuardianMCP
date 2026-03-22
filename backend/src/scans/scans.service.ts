import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scan } from '@/scans/entities/scan.entity';
import { Finding } from '@/findings/entities/finding.entity';
import { ScanStatus } from '@/common/enums';
import { PaginatedResponseDto } from '@/common/dto/paginated-response.dto';
import { QueryScanDto } from './dto/query-scan.dto';

@Injectable()
export class ScansService {
  constructor(
    @InjectRepository(Scan)
    private readonly scanRepo: Repository<Scan>,

    @InjectRepository(Finding)
    private readonly findingRepo: Repository<Finding>,
  ) {}

  async create(
    serverId: string,
    orgId: string,
    cliVersion?: string,
  ): Promise<Scan> {
    const scan = this.scanRepo.create({
      serverId,
      orgId,
      status: ScanStatus.PENDING,
      cliVersion,
    });
    return this.scanRepo.save(scan);
  }

  async findAll(
    orgId: string,
    query: QueryScanDto,
  ): Promise<PaginatedResponseDto<Scan>> {
    const { page = 1, limit = 20, serverId, status, startDate, endDate } = query;

    const qb = this.scanRepo
      .createQueryBuilder('scan')
      .where('scan.orgId = :orgId', { orgId })
      .orderBy('scan.createdAt', 'DESC');

    if (serverId) {
      qb.andWhere('scan.serverId = :serverId', { serverId });
    }

    if (status) {
      qb.andWhere('scan.status = :status', { status });
    }

    if (startDate) {
      qb.andWhere('scan.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('scan.createdAt <= :endDate', { endDate });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findById(id: string, orgId: string): Promise<Scan> {
    const scan = await this.scanRepo.findOne({
      where: { id, orgId },
      relations: ['findings'],
    });

    if (!scan) {
      throw new NotFoundException(`Scan ${id} not found`);
    }

    return scan;
  }

  async updateStatus(
    id: string,
    status: ScanStatus,
    extras?: Partial<Scan>,
  ): Promise<Scan> {
    const scan = await this.scanRepo.findOne({ where: { id } });

    if (!scan) {
      throw new NotFoundException(`Scan ${id} not found`);
    }

    scan.status = status;
    Object.assign(scan, extras);

    return this.scanRepo.save(scan);
  }

  async getReport(id: string, orgId: string): Promise<{ reportUrl: string }> {
    const scan = await this.scanRepo.findOne({
      where: { id, orgId },
      select: ['id', 'reportUrl'],
    });

    if (!scan) {
      throw new NotFoundException(`Scan ${id} not found`);
    }

    if (!scan.reportUrl) {
      throw new NotFoundException(`Report not available for scan ${id}`);
    }

    return { reportUrl: scan.reportUrl };
  }
}
