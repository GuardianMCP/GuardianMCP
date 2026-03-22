import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { execFile } from 'child_process';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';
import { Scan } from '@/scans/entities/scan.entity';
import { Finding } from '@/findings/entities/finding.entity';
import { Server } from '@/servers/entities/server.entity';
import { ScanSseService } from '@/scans/sse/scan-sse.service';
import { ScanStatus } from '@/common/enums';
import { generateFingerprint } from '@/common/utils/fingerprint.util';
import { ScanJobPayload } from '../interfaces/scan-job.interface';

const execFileAsync = promisify(execFile);

interface CLIScanResult {
  findings: Array<{
    ruleId: string;
    ruleName: string;
    severity: string;
    file: string;
    line: number;
    column: number;
    snippet: string;
    message: string;
    remediation: string;
    confidence: string;
    cveRefs?: string[];
    owaspRefs?: string[];
  }>;
  filesScanned: number;
  rulesChecked: number;
  durationMs: number;
  securityScore: number;
  cliVersion: string;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

@Processor('scan-jobs')
export class ScanJobProcessor extends WorkerHost {
  private readonly logger = new Logger(ScanJobProcessor.name);

  constructor(
    @InjectRepository(Scan)
    private readonly scanRepo: Repository<Scan>,
    @InjectRepository(Finding)
    private readonly findingRepo: Repository<Finding>,
    @InjectRepository(Server)
    private readonly serverRepo: Repository<Server>,
    private readonly sseService: ScanSseService,
  ) {
    super();
  }

  async process(job: Job<ScanJobPayload>): Promise<void> {
    const { scanId, serverId, orgId, repoUrl, branch } = job.data;
    let tmpDir: string | null = null;

    try {
      // Step 1: Mark scan as running
      await this.scanRepo.update(scanId, {
        status: ScanStatus.RUNNING,
        startedAt: new Date(),
      });

      this.sseService.emit(scanId, {
        type: 'progress',
        data: { step: 'cloning', progress: 10, message: `Cloning ${branch}...` },
      });

      // Step 2: Clone repo
      tmpDir = await mkdtemp(join(tmpdir(), 'guardianmcp-scan-'));
      this.logger.log(`Cloning ${repoUrl}@${branch} into ${tmpDir}`);

      await execFileAsync('git', [
        'clone',
        '--depth', '1',
        '--branch', branch,
        repoUrl,
        tmpDir,
      ], { timeout: 120_000 });

      this.sseService.emit(scanId, {
        type: 'progress',
        data: { step: 'scanning', progress: 30, message: 'Running security scan...' },
      });

      // Step 3: Run CLI scanner
      const cliBinary = join(process.cwd(), '..', 'cli', 'guardianmcp');
      const { stdout } = await execFileAsync(cliBinary, [
        'scan', tmpDir, '--format', 'json',
      ], { timeout: 300_000, maxBuffer: 50 * 1024 * 1024 });

      this.sseService.emit(scanId, {
        type: 'progress',
        data: { step: 'processing', progress: 70, message: 'Processing results...' },
      });

      // Step 4: Parse CLI output
      const result: CLIScanResult = JSON.parse(stdout);

      // Step 5: Save findings
      const totalFindings = result.findings?.length ?? 0;
      if (result.findings && totalFindings > 0) {
        const findingEntities = result.findings.map((f) =>
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
            scanId,
            serverId,
            orgId,
          }),
        );
        await this.findingRepo.save(findingEntities);
      }

      this.sseService.emit(scanId, {
        type: 'progress',
        data: { step: 'saving', progress: 90, message: `Found ${totalFindings} findings` },
      });

      // Step 6: Update scan record
      const summary = {
        critical: result.summary?.critical ?? 0,
        high: result.summary?.high ?? 0,
        medium: result.summary?.medium ?? 0,
        low: result.summary?.low ?? 0,
        info: result.summary?.info ?? 0,
        total: totalFindings,
      };

      await this.scanRepo.update(scanId, {
        status: ScanStatus.COMPLETED,
        securityScore: result.securityScore,
        filesScanned: result.filesScanned,
        rulesChecked: result.rulesChecked,
        durationMs: result.durationMs,
        cliVersion: result.cliVersion,
        summary,
        completedAt: new Date(),
      });

      // Update server score
      await this.serverRepo.update(serverId, {
        lastScanId: scanId,
        securityScore: result.securityScore,
      });

      // Step 7: Complete SSE
      this.sseService.emit(scanId, {
        type: 'completed',
        data: {
          step: 'completed',
          progress: 100,
          message: 'Scan complete',
          securityScore: result.securityScore,
          totalFindings,
          summary,
        },
      });

      this.logger.log(
        `Scan ${scanId} completed: score=${result.securityScore}, findings=${totalFindings}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Scan ${scanId} failed: ${errorMessage}`);

      await this.scanRepo.update(scanId, {
        status: ScanStatus.FAILED,
        errorMessage,
        completedAt: new Date(),
      });

      this.sseService.emit(scanId, {
        type: 'error',
        data: { step: 'error', progress: 0, message: errorMessage },
      });
    } finally {
      // Clean up temp directory
      if (tmpDir) {
        try {
          await rm(tmpDir, { recursive: true, force: true });
        } catch {
          this.logger.warn(`Failed to clean up temp dir: ${tmpDir}`);
        }
      }

      this.sseService.complete(scanId);
    }
  }
}
