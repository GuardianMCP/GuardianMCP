export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed';
export type FindingStatus = 'open' | 'acknowledged' | 'resolved' | 'false_positive';
export type Plan = 'free' | 'pro' | 'enterprise';
export type Role = 'owner' | 'admin' | 'member';

export type ScanTrigger = 'cli' | 'dashboard';

export interface Server {
  id: string;
  name: string;
  description: string | null;
  language: string | null;
  repository: string | null;
  defaultBranch: string | null;
  lastScanId: string | null;
  securityScore: number;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Scan {
  id: string;
  status: ScanStatus;
  securityScore: number | null;
  filesScanned: number;
  rulesChecked: number;
  durationMs: number | null;
  cliVersion: string | null;
  reportUrl: string | null;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  } | null;
  branch: string | null;
  trigger: ScanTrigger;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  serverId: string;
  orgId: string;
  createdAt: string;
  server?: Server;
  findings?: Finding[];
}

export interface Finding {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: Severity;
  status: FindingStatus;
  file: string;
  line: number;
  column: number;
  snippet: string;
  message: string;
  remediation: string;
  note: string | null;
  confidence: string;
  cveRefs: string[];
  owaspRefs: string[];
  fingerprint: string;
  scanId: string;
  serverId: string;
  createdAt: string;
}

export interface AlertRule {
  id: string;
  name: string;
  triggerType: string;
  conditions: Record<string, unknown>;
  channel: string;
  channelConfig: Record<string, unknown>;
  enabled: boolean;
  orgId: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  createdAt: string;
  members?: User[];
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  orgId: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
