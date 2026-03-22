import type { Severity } from '@/types/api';
import { SEVERITY_BG } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        SEVERITY_BG[severity],
        className,
      )}
    >
      {severity}
    </span>
  );
}
