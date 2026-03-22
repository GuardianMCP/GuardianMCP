import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scan } from '@/scans/entities/scan.entity';
import { Finding } from '@/findings/entities/finding.entity';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Scan) private readonly scanRepo: Repository<Scan>,
    @InjectRepository(Finding) private readonly findingRepo: Repository<Finding>,
    private readonly configService: ConfigService,
  ) {}

  async generateReport(scanId: string, orgId: string): Promise<string> {
    const scan = await this.scanRepo.findOne({
      where: { id: scanId, orgId },
      relations: ['server'],
    });
    if (!scan) throw new NotFoundException('Scan not found');

    const findings = await this.findingRepo.find({
      where: { scanId },
      order: { severity: 'ASC', line: 'ASC' },
    });

    const html = this.buildHTML(scan, findings);

    // In production, upload to S3 and return pre-signed URL
    // For now, store the report URL as a data URI placeholder
    const reportUrl = `data:text/html;base64,${Buffer.from(html).toString('base64')}`;

    await this.scanRepo.update(scanId, { reportUrl });
    return reportUrl;
  }

  private buildHTML(scan: Scan, findings: Finding[]): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GuardianMCP Report - ${scan.id}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; background: #0f172a; color: #e2e8f0; }
    .header { border-bottom: 2px solid #334155; padding-bottom: 1rem; margin-bottom: 2rem; }
    .score { font-size: 3rem; font-weight: bold; color: ${(scan.securityScore ?? 0) >= 80 ? '#22c55e' : (scan.securityScore ?? 0) >= 50 ? '#eab308' : '#ef4444'}; }
    .finding { background: #1e293b; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; border-left: 4px solid; }
    .CRITICAL { border-color: #ef4444; }
    .HIGH { border-color: #f97316; }
    .MEDIUM { border-color: #eab308; }
    .LOW { border-color: #3b82f6; }
    .INFO { border-color: #6b7280; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    pre { background: #0f172a; padding: 0.5rem; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="header">
    <h1>GuardianMCP Security Report</h1>
    <div class="score">${scan.securityScore ?? '-'}/100</div>
    <p>Scan: ${scan.id} | Files: ${scan.filesScanned} | Duration: ${scan.durationMs}ms</p>
  </div>
  <h2>${findings.length} Finding${findings.length !== 1 ? 's' : ''}</h2>
  ${findings.map((f) => `
  <div class="finding ${f.severity}">
    <strong>${f.ruleId}: ${f.ruleName}</strong>
    <span class="badge">${f.severity}</span>
    <p>${f.message}</p>
    <p><small>${f.file}:${f.line}</small></p>
    <pre>${this.escapeHtml(f.snippet)}</pre>
    <p><em>Fix: ${f.remediation}</em></p>
  </div>`).join('\n')}
</body>
</html>`;
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
