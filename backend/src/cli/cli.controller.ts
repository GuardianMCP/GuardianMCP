import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompositeAuthGuard } from '@/auth/guards/composite-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Scan } from '@/scans/entities/scan.entity';
import { Finding } from '@/findings/entities/finding.entity';
import { Server } from '@/servers/entities/server.entity';
import { ScanStatus } from '@/common/enums';
import { generateFingerprint } from '@/common/utils/fingerprint.util';

interface UploadFinding {
  ruleId: string;
  ruleName: string;
  severity: string;
  file: string;
  line: number;
  column?: number;
  snippet: string;
  message: string;
  remediation: string;
  confidence: string;
  cveRefs?: string[];
  owaspRefs?: string[];
}

interface UploadBody {
  serverId: string;
  findings: UploadFinding[];
  filesScanned: number;
  rulesChecked: number;
  durationMs: number;
  cliVersion?: string;
  securityScore?: number;
  summary?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
}

@Controller('cli')
@UseGuards(CompositeAuthGuard)
export class CliController {
  private readonly logger = new Logger(CliController.name);

  constructor(
    @InjectRepository(Scan)
    private readonly scanRepo: Repository<Scan>,

    @InjectRepository(Finding)
    private readonly findingRepo: Repository<Finding>,

    @InjectRepository(Server)
    private readonly serverRepo: Repository<Server>,
  ) {}

  @Post('upload')
  async upload(
    @CurrentUser('orgId') orgId: string,
    @Body() body: UploadBody,
  ) {
    const server = await this.serverRepo.findOne({
      where: { id: body.serverId, orgId },
    });

    if (!server) {
      this.logger.warn(
        `Server ${body.serverId} not found for org ${orgId}`,
      );
    }

    const scan = this.scanRepo.create({
      serverId: body.serverId,
      orgId,
      status: ScanStatus.COMPLETED,
      filesScanned: body.filesScanned,
      rulesChecked: body.rulesChecked,
      durationMs: body.durationMs,
      cliVersion: body.cliVersion,
      securityScore: body.securityScore,
      summary: body.summary,
      startedAt: new Date(Date.now() - (body.durationMs || 0)),
      completedAt: new Date(),
    });

    const savedScan = await this.scanRepo.save(scan);

    if (body.findings && body.findings.length > 0) {
      const findingEntities = body.findings.map((f) =>
        this.findingRepo.create({
          ruleId: f.ruleId,
          ruleName: f.ruleName,
          severity: f.severity as any,
          file: f.file,
          line: f.line,
          column: f.column ?? 1,
          snippet: f.snippet,
          message: f.message,
          remediation: f.remediation,
          confidence: f.confidence,
          cveRefs: f.cveRefs,
          owaspRefs: f.owaspRefs,
          fingerprint: generateFingerprint(f.ruleId, f.file, f.snippet),
          scanId: savedScan.id,
          serverId: body.serverId,
          orgId,
        }),
      );

      await this.findingRepo.save(findingEntities);
    }

    if (server) {
      await this.serverRepo.update(server.id, {
        lastScanId: savedScan.id,
        securityScore: body.securityScore ?? server.securityScore,
      });
    }

    return {
      scanId: savedScan.id,
      dashboardUrl: `/scans/${savedScan.id}`,
    };
  }
}
