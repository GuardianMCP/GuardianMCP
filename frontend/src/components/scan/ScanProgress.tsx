import type { ScanStatus } from '@/types/api';
import { cn } from '@/lib/utils';

interface ScanProgressProps {
  status: ScanStatus;
  progress: number;
  phase?: string;
  className?: string;
}

const statusLabel: Record<ScanStatus, string> = {
  pending: 'Waiting to start...',
  running: 'Scanning...',
  completed: 'Scan complete',
  failed: 'Scan failed',
};

export function ScanProgress({
  status,
  progress,
  phase,
  className,
}: ScanProgressProps) {
  const isActive = status === 'running' || status === 'pending';
  const isFailed = status === 'failed';
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn('w-full', className)}>
      {/* Label row */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">
          {phase ?? statusLabel[status]}
        </span>
        <span
          className={cn(
            'text-sm font-mono',
            isFailed ? 'text-red-400' : 'text-slate-400',
          )}
        >
          {clampedProgress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isFailed
              ? 'bg-red-500'
              : status === 'completed'
                ? 'bg-green-500'
                : 'bg-blue-500',
            isActive && 'animate-pulse',
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      {/* Phase detail */}
      {isActive && phase && (
        <p className="mt-1.5 text-xs text-slate-500">
          {statusLabel[status]}
        </p>
      )}
    </div>
  );
}
