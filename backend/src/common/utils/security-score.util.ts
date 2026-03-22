import { Severity } from '../enums';

interface FindingSeverityCount {
  [Severity.CRITICAL]: number;
  [Severity.HIGH]: number;
  [Severity.MEDIUM]: number;
  [Severity.LOW]: number;
  [Severity.INFO]: number;
}

export function calculateSecurityScore(counts: FindingSeverityCount): number {
  let score = 100;

  score -= Math.min(counts[Severity.CRITICAL] * 25, 50);
  score -= Math.min(counts[Severity.HIGH] * 10, 30);
  score -= Math.min(counts[Severity.MEDIUM] * 3, 15);
  score -= Math.min(counts[Severity.LOW] * 1, 5);

  return Math.max(score, 0);
}
