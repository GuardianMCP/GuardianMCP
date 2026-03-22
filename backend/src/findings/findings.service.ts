import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Finding } from '@/findings/entities/finding.entity';
import { PaginatedResponseDto } from '@/common/dto/paginated-response.dto';
import { QueryFindingDto } from './dto/query-finding.dto';
import { UpdateFindingDto } from './dto/update-finding.dto';
import { BulkUpdateFindingsDto } from './dto/bulk-update-findings.dto';

@Injectable()
export class FindingsService {
  constructor(
    @InjectRepository(Finding)
    private readonly findingRepo: Repository<Finding>,
  ) {}

  async findAll(
    orgId: string,
    query: QueryFindingDto,
  ): Promise<PaginatedResponseDto<Finding>> {
    const { page = 1, limit = 20, serverId, ruleId, severity, status } = query;

    const qb = this.findingRepo
      .createQueryBuilder('finding')
      .where('finding.orgId = :orgId', { orgId })
      .orderBy('finding.createdAt', 'DESC');

    if (serverId) {
      qb.andWhere('finding.serverId = :serverId', { serverId });
    }

    if (ruleId) {
      qb.andWhere('finding.ruleId = :ruleId', { ruleId });
    }

    if (severity) {
      qb.andWhere('finding.severity = :severity', { severity });
    }

    if (status) {
      qb.andWhere('finding.status = :status', { status });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findById(id: string, orgId: string): Promise<Finding> {
    const finding = await this.findingRepo.findOne({
      where: { id, orgId },
    });

    if (!finding) {
      throw new NotFoundException(`Finding ${id} not found`);
    }

    return finding;
  }

  async update(
    id: string,
    orgId: string,
    dto: UpdateFindingDto,
  ): Promise<Finding> {
    const finding = await this.findById(id, orgId);

    if (dto.status !== undefined) {
      finding.status = dto.status;
    }

    if (dto.note !== undefined) {
      finding.note = dto.note;
    }

    return this.findingRepo.save(finding);
  }

  async bulkUpdate(
    orgId: string,
    dto: BulkUpdateFindingsDto,
  ): Promise<{ updated: number }> {
    const result = await this.findingRepo
      .createQueryBuilder()
      .update(Finding)
      .set({
        status: dto.status,
        ...(dto.note !== undefined && { note: dto.note }),
      })
      .where('id IN (:...ids)', { ids: dto.ids })
      .andWhere('orgId = :orgId', { orgId })
      .execute();

    return { updated: result.affected ?? 0 };
  }
}
