import { createHash } from 'crypto';

export function generateFingerprint(
  ruleId: string,
  file: string,
  snippet: string,
): string {
  const data = `${ruleId}:${file}:${snippet}`;
  return createHash('sha256').update(data).digest('hex');
}
